begin;

-- Convert the lowest-weight duplicate Try Again outcome into Spin Again.
with spin_again_candidate as (
  select id
  from public.wheel_outcomes
  where active = true
    and type = 'loss'
    and prize_id is null
    and lower(label) = 'try again'
  order by probability asc, id desc
  limit 1
)
update public.wheel_outcomes
set label = 'Spin Again'
where id in (select id from spin_again_candidate);

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
  is_spin_again boolean;
  next_remaining_spins integer;
begin
  select * into current_profile
  from public.profiles
  where id = p_user_id
  for update;

  if not found then raise exception 'Profile not found'; end if;
  if current_profile.remaining_spins <= 0 then raise exception 'No spins remaining'; end if;

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

  is_spin_again := selected_outcome.type = 'loss'
    and selected_outcome.prize_id is null
    and lower(selected_outcome.label) = 'spin again';
  next_remaining_spins := current_profile.remaining_spins - case when is_spin_again then 0 else 1 end;

  update public.profiles
  set remaining_spins = next_remaining_spins,
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
    'remainingSpins', next_remaining_spins,
    'won', selected_prize.id is not null,
    'spinAgain', is_spin_again,
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

commit;
