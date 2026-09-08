-- Cap fundraiser sales and keep prize outcome weights tied to prize value.
begin;

create or replace function public.sold_spin_count()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(spins), 0)::bigint from public.payment_logs;
$$;

revoke all on function public.sold_spin_count() from public;
grant execute on function public.sold_spin_count() to service_role;

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
  sold_spins bigint;
begin
  if p_spins <= 0 or p_spins > 100 or p_amount <= 0 then
    raise exception 'Invalid payment values';
  end if;

  lock table public.payment_logs in exclusive mode;
  insert into public.payment_logs(payment_intent_id, user_id, spins, amount)
  values (p_payment_intent_id, p_user_id, p_spins, p_amount)
  on conflict (payment_intent_id) do nothing;

  get diagnostics inserted_count = row_count;
  if inserted_count = 0 then return false; end if;

  select coalesce(sum(spins), 0) into sold_spins from public.payment_logs;
  if sold_spins > 2000 then
    raise exception 'The 2000 spin limit has been reached';
  end if;

  update public.profiles
  set remaining_spins = remaining_spins + p_spins,
      total_spins = total_spins + p_spins,
      updated_at = now()
  where id = p_user_id;

  if not found then raise exception 'Profile not found'; end if;
  return true;
end;
$$;

revoke all on function public.credit_completed_payment(text, uuid, integer, integer) from public;
grant execute on function public.credit_completed_payment(text, uuid, integer, integer) to service_role;

create or replace function public.refresh_prize_value_weights()
returns void
language sql
security definer
set search_path = public
as $$
  with value_range as (
    select greatest(coalesce(max(retail_value), 1), 1)::numeric as highest_value
    from public.prizes
    where active = true and quantity > 0 and retail_value > 0
  )
  update public.wheel_outcomes wo
  set probability = greatest(1, round(100 * value_range.highest_value / greatest(p.retail_value, 1)))::integer
  from public.prizes p, value_range
  where wo.type = 'prize' and wo.prize_id = p.id;
$$;

select public.refresh_prize_value_weights();

create or replace function public.sync_prize_value_weights()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_prize_value_weights();
  return null;
end;
$$;

drop trigger if exists sync_prize_value_weights on public.prizes;
create trigger sync_prize_value_weights
  after insert or update of retail_value, active, quantity or delete on public.prizes
  for each statement execute function public.sync_prize_value_weights();

commit;
