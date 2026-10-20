-- Run once in the Supabase SQL Editor with the postgres role.
-- Sets initial relative odds; does not guarantee every prize is awarded
-- within 1,200 spins or change the purchase limit.
begin;
lock table public.prizes, public.wheel_outcomes in share row exclusive mode;

-- Otherwise every award overwrites the configured weights with value weights.
drop trigger if exists sync_prize_value_weights on public.prizes;

do $$
declare
  stock integer;
begin
  select coalesce(sum(quantity), 0) into stock
  from public.prizes where active and quantity > 0;
  if stock >= 1200 then
    raise exception 'Active stock must be less than 1200 for this configuration';
  end if;
  if exists (
    select p.id from public.prizes p
    left join public.wheel_outcomes o on o.prize_id = p.id and o.type = 'prize'
    where p.active and p.quantity > 0
    group by p.id having count(o.id) <> 1
  ) then
    raise exception 'Each stocked active prize must have exactly one outcome';
  end if;
  if (select count(*) from public.wheel_outcomes
      where type = 'loss' and prize_id is null
        and lower(trim(label)) = 'try again') <> 1 then
    raise exception 'Expected exactly one Try Again outcome';
  end if;

  update public.wheel_outcomes o
  set probability = greatest(p.quantity, 1),
      active = p.active and p.quantity > 0
  from public.prizes p where o.type = 'prize' and o.prize_id = p.id;

  update public.wheel_outcomes
  set active = lower(trim(label)) = 'try again',
      probability = case when lower(trim(label)) = 'try again'
                         then 1200 - stock else probability end
  where type = 'loss' and prize_id is null;

  if (select sum(probability) from public.wheel_outcomes where active) <> 1200 then
    raise exception 'Active outcome weights do not total 1200';
  end if;
end $$;
commit;

select label, probability, round(100.0 * probability / 1200, 3) as initial_percent
from public.wheel_outcomes where active order by id;
