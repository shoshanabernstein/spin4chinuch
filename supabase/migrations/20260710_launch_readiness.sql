-- Spin4Chinuch launch-readiness migration
-- Apply in the Supabase SQL editor before deploying the matching application code.

begin;

update public.profiles set remaining_spins = 0 where remaining_spins < 0;
update public.profiles set total_spins = 0 where total_spins < 0;
update public.prizes set name = 'Untitled prize' where name is null;
update public.prizes set quantity = 0 where quantity is null or quantity < 0;
update public.prizes set active = false where active is null;
update public.wheel_outcomes set probability = 1 where probability <= 0;
update public.wheel_outcomes
set type = case when prize_id is null then 'loss' else 'prize' end
where type not in ('prize', 'loss')
   or (type = 'prize' and prize_id is null)
   or (type = 'loss' and prize_id is not null);

alter table public.prizes
  alter column active set default true,
  alter column active set not null,
  alter column quantity set default 0,
  alter column quantity set not null,
  alter column name set not null;

alter table public.prizes drop column if exists probability;

alter table public.payment_logs
  add constraint payment_logs_user_id_fkey
  foreign key (user_id) references public.profiles(id) on delete set null;

alter table public.profiles
  add constraint profiles_remaining_spins_nonnegative check (remaining_spins >= 0),
  add constraint profiles_total_spins_nonnegative check (total_spins >= 0);

alter table public.prizes
  add constraint prizes_quantity_nonnegative check (quantity >= 0);

alter table public.wheel_outcomes
  add constraint wheel_outcomes_probability_positive check (probability > 0),
  add constraint wheel_outcomes_type_valid check (type in ('prize', 'loss')),
  add constraint wheel_outcomes_prize_shape check (
    (type = 'prize' and prize_id is not null)
    or (type = 'loss' and prize_id is null)
  );

alter table public.payment_logs
  add constraint payment_logs_spins_positive check (spins > 0),
  add constraint payment_logs_amount_positive check (amount > 0);

create index if not exists wins_user_id_idx on public.wins(user_id);
create index if not exists wins_created_at_idx on public.wins(created_at desc);
create index if not exists spin_history_user_id_idx on public.spin_history(user_id);
create index if not exists payment_logs_user_id_idx on public.payment_logs(user_id);
create index if not exists wheel_outcomes_active_idx on public.wheel_outcomes(active);
create index if not exists prizes_active_quantity_idx on public.prizes(active, quantity);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id, email, first_name, last_name, phone, address1, address2,
    city, state, zip, country
  ) values (
    new.id,
    lower(new.email),
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    nullif(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.raw_user_meta_data->>'address1', ''),
    nullif(new.raw_user_meta_data->>'address2', ''),
    coalesce(new.raw_user_meta_data->>'city', ''),
    coalesce(new.raw_user_meta_data->>'state', ''),
    coalesce(new.raw_user_meta_data->>'zip', ''),
    coalesce(new.raw_user_meta_data->>'country', 'United States')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.credit_completed_payment(
  p_payment_intent_id text,
  p_user_id uuid,
  p_spins integer,
  p_amount integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_count integer;
begin
  if p_spins <= 0 or p_spins > 100 or p_amount <= 0 then
    raise exception 'Invalid payment values';
  end if;

  insert into public.payment_logs(payment_intent_id, user_id, spins, amount)
  values (p_payment_intent_id, p_user_id, p_spins, p_amount)
  on conflict (payment_intent_id) do nothing;

  get diagnostics inserted_count = row_count;
  if inserted_count = 0 then
    return false;
  end if;

  update public.profiles
  set remaining_spins = remaining_spins + p_spins,
      total_spins = total_spins + p_spins,
      updated_at = now()
  where id = p_user_id;

  if not found then
    raise exception 'Profile not found';
  end if;

  return true;
end;
$$;

revoke all on function public.credit_completed_payment(text, uuid, integer, integer) from public;
grant execute on function public.credit_completed_payment(text, uuid, integer, integer) to service_role;

create or replace function public.perform_spin(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_profile public.profiles%rowtype;
  selected_outcome public.wheel_outcomes%rowtype;
  selected_prize public.prizes%rowtype;
  total_weight numeric;
  random_weight numeric;
  item record;
begin
  select * into current_profile
  from public.profiles
  where id = p_user_id
  for update;

  if not found then raise exception 'Profile not found'; end if;
  if current_profile.remaining_spins <= 0 then raise exception 'No spins remaining'; end if;

  -- Lock eligible inventory rows so two spins cannot take the final item.
  perform 1 from public.prizes
  where active = true and quantity > 0
  order by id
  for update;

  select sum(wo.probability) into total_weight
  from public.wheel_outcomes wo
  left join public.prizes p on p.id = wo.prize_id
  where wo.active = true
    and wo.probability > 0
    and (
      (wo.type = 'loss' and wo.prize_id is null)
      or (wo.type = 'prize' and p.active = true and p.quantity > 0)
    );

  if coalesce(total_weight, 0) <= 0 then
    raise exception 'No eligible wheel outcomes';
  end if;

  random_weight := random() * total_weight;
  for item in
    select wo.*
    from public.wheel_outcomes wo
    left join public.prizes p on p.id = wo.prize_id
    where wo.active = true
      and wo.probability > 0
      and (
        (wo.type = 'loss' and wo.prize_id is null)
        or (wo.type = 'prize' and p.active = true and p.quantity > 0)
      )
    order by wo.id
  loop
    random_weight := random_weight - item.probability;
    if random_weight <= 0 then
      select * into selected_outcome from public.wheel_outcomes where id = item.id;
      exit;
    end if;
  end loop;

  if selected_outcome.id is null then raise exception 'Unable to select outcome'; end if;

  update public.profiles
  set remaining_spins = remaining_spins - 1,
      updated_at = now()
  where id = p_user_id;

  if selected_outcome.prize_id is not null then
    update public.prizes
    set quantity = quantity - 1
    where id = selected_outcome.prize_id and active = true and quantity > 0
    returning * into selected_prize;

    if selected_prize.id is null then raise exception 'Prize no longer available'; end if;

    insert into public.wins(
      user_id, user_email, prize, prize_id, outcome_id, retail_value,
      sponsor_name, delivery_type, delivery_instructions, status
    ) values (
      p_user_id, current_profile.email, selected_prize.name, selected_prize.id,
      selected_outcome.id, selected_prize.retail_value, selected_prize.sponsor_name,
      selected_prize.delivery_type, selected_prize.delivery_instructions, 'Pending'
    );
  end if;

  insert into public.spin_history(user_id, outcome_id, won)
  values (p_user_id, selected_outcome.id, selected_prize.id is not null);

  return jsonb_build_object(
    'outcomeId', selected_outcome.id,
    'outcomeLabel', selected_outcome.label,
    'remainingSpins', current_profile.remaining_spins - 1,
    'won', selected_prize.id is not null,
    'prize', case when selected_prize.id is null then null else jsonb_build_object(
      'id', selected_prize.id,
      'name', selected_prize.name,
      'retailValue', selected_prize.retail_value,
      'sponsor', selected_prize.sponsor_name
    ) end
  );
end;
$$;

revoke all on function public.perform_spin(uuid) from public;
grant execute on function public.perform_spin(uuid) to service_role;

create or replace view public.public_wheel_outcomes as
select wo.id, wo.label, wo.prize_id, wo.created_at
from public.wheel_outcomes wo
left join public.prizes p on p.id = wo.prize_id
where wo.active = true
  and (
    (wo.type = 'loss' and wo.prize_id is null)
    or (wo.type = 'prize' and p.active = true and p.quantity > 0)
  );

create or replace view public.public_winners as
select
  w.id,
  w.created_at,
  w.prize,
  left(p.first_name, 1) || left(p.last_name, 1) as initials,
  p.city
from public.wins w
join public.profiles p on p.id = w.user_id
where w.status <> 'Cancelled';

grant select on public.public_wheel_outcomes to anon, authenticated;
grant select on public.public_winners to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.prizes enable row level security;
alter table public.wins enable row level security;
alter table public.wheel_outcomes enable row level security;
alter table public.spin_history enable row level security;
alter table public.payment_logs enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles for select
  to authenticated using (id = auth.uid() or public.is_admin());

drop policy if exists prizes_public_read on public.prizes;
create policy prizes_public_read on public.prizes for select
  using ((active = true and quantity > 0) or public.is_admin());
drop policy if exists prizes_admin_write on public.prizes;
create policy prizes_admin_write on public.prizes for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists wins_select_own on public.wins;
create policy wins_select_own on public.wins for select
  to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists wins_admin_write on public.wins;
create policy wins_admin_write on public.wins for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists outcomes_admin_all on public.wheel_outcomes;
create policy outcomes_admin_all on public.wheel_outcomes for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists history_select_own on public.spin_history;
create policy history_select_own on public.spin_history for select
  to authenticated using (user_id = auth.uid() or public.is_admin());

drop policy if exists payments_select_own on public.payment_logs;
create policy payments_select_own on public.payment_logs for select
  to authenticated using (user_id = auth.uid() or public.is_admin());

commit;
