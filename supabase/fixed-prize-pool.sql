-- ONE-TIME installation: run as postgres in Supabase SQL Editor before any spins
-- have been used. Purchases/balances are preserved. Do not rerun reset-campaign
-- or soft-launch scripts after this installation.
-- Inventory is read at installation time, never from a hard-coded prize list.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';
lock table public.profiles, public.prizes, public.wheel_outcomes,
  public.wins, public.spin_history, public.spin_requests in access exclusive mode;

do $$
begin
  if exists (select 1 from public.spin_history) or exists (select 1 from public.wins)
     or exists (select 1 from public.spin_requests) then
    raise exception 'Install the fixed pool before the first used spin; existing results must not be reset';
  end if;
  if (select count(*) from public.wheel_outcomes
      where type = 'loss' and prize_id is null and lower(trim(label)) = 'try again') <> 1 then
    raise exception 'Exactly one Try Again outcome is required';
  end if;
  if exists (select p.id from public.prizes p
      left join public.wheel_outcomes o on o.prize_id = p.id and o.type = 'prize'
      where p.active and p.quantity > 0 group by p.id having count(o.id) <> 1) then
    raise exception 'Each stocked active prize must have exactly one prize outcome';
  end if;
  if (select coalesce(sum(quantity),0) from public.prizes where active and quantity > 0) > 1100 then
    raise exception 'Prize inventory exceeds the 1100-spin campaign';
  end if;
end $$;

create schema campaign_pool;
revoke all on schema campaign_pool from public, anon, authenticated, service_role;
create table campaign_pool.state (
  singleton boolean primary key default true check (singleton),
  remaining integer not null check (remaining between 0 and 1100)
);
create table campaign_pool.entries (
  outcome_id bigint primary key references public.wheel_outcomes(id) on delete restrict,
  prize_id bigint unique references public.prizes(id) on delete restrict,
  initial_count integer not null check (initial_count >= 0),
  remaining integer not null check (remaining between 0 and initial_count)
);
alter table campaign_pool.state enable row level security;
alter table campaign_pool.entries enable row level security;
revoke all on all tables in schema campaign_pool from public, anon, authenticated, service_role;
insert into campaign_pool.state values (true,1100);
insert into campaign_pool.entries
select o.id,p.id,p.quantity,p.quantity from public.prizes p
join public.wheel_outcomes o on o.prize_id = p.id and o.type = 'prize'
where p.active and p.quantity > 0;
insert into campaign_pool.entries
select id,null,1100-stock,1100-stock from public.wheel_outcomes
cross join (select coalesce(sum(initial_count),0)::integer stock from campaign_pool.entries) s
where type = 'loss' and prize_id is null and lower(trim(label)) = 'try again';

-- Set legacy display weights to the initial pool counts; actual draws below
-- always use the private remaining counts. Keep other outcomes off the wheel.
drop trigger if exists sync_prize_value_weights on public.prizes;
update public.wheel_outcomes o set active = exists (
  select 1 from campaign_pool.entries e where e.outcome_id = o.id
);
update public.wheel_outcomes o set probability = greatest(e.initial_count,1),
  label = coalesce(p.name,o.label)
from campaign_pool.entries e left join public.prizes p on p.id=e.prize_id
where e.outcome_id = o.id;

-- Keep inventory/eligibility in sync. Prize text, pictures, sponsor details,
-- and fulfillment fields remain editable; changing campaign stock needs an
-- explicit pool adjustment, never an accidental change from the admin screen.
create function campaign_pool.guard_prize() returns trigger
language plpgsql security definer set search_path = '' as $$
declare stock integer;
begin
  if tg_op = 'DELETE' then
    if exists (select 1 from campaign_pool.entries where prize_id = old.id) then
      raise exception 'Fixed-pool prizes cannot be deleted during this campaign';
    end if;
    return old;
  end if;
  select remaining into stock from campaign_pool.entries where prize_id = new.id;
  if found then
    if not new.active or new.quantity is distinct from stock then
      raise exception 'Fixed-pool inventory is managed by spins; stock and eligibility are locked';
    end if;
  elsif new.active and new.quantity > 0 then
    raise exception 'New active stock requires an explicit fixed-pool adjustment';
  end if;
  return new;
end $$;
revoke all on function campaign_pool.guard_prize() from public, anon, authenticated, service_role;
create trigger fixed_pool_prize_guard before insert or update or delete on public.prizes
for each row execute function campaign_pool.guard_prize();

create function campaign_pool.guard_outcome() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if new.active then raise exception 'New outcomes require an explicit fixed-pool adjustment'; end if;
    return new;
  end if;
  if exists (select 1 from campaign_pool.entries where outcome_id = old.id) then
    if tg_op = 'DELETE' then raise exception 'Fixed-pool outcomes cannot be deleted'; end if;
    if new.id is distinct from old.id or new.prize_id is distinct from old.prize_id
       or new.type is distinct from old.type or new.active is distinct from old.active
       or new.probability is distinct from old.probability
       or (old.type = 'loss' and new.label is distinct from old.label) then
      raise exception 'Fixed-pool weights and eligibility are locked for this campaign';
    end if;
  elsif tg_op = 'UPDATE' and new.active then
    raise exception 'New outcomes require an explicit fixed-pool adjustment';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;
revoke all on function campaign_pool.guard_outcome() from public, anon, authenticated, service_role;
create trigger fixed_pool_outcome_guard before insert or update or delete on public.wheel_outcomes
for each row execute function campaign_pool.guard_outcome();

-- Retains the existing server-only RPC contract and gift-card win trigger.
-- The existing perform_spin_once wrapper still provides safe request replay.
create or replace function public.perform_spin(p_user_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  person public.profiles%rowtype;
  outcome public.wheel_outcomes%rowtype;
  prize public.prizes%rowtype;
  slots integer;
  ticket integer;
  chosen bigint;
  item record;
  won_id bigint;
begin
  select * into person from public.profiles where id = p_user_id for update;
  if not found then raise exception 'Profile not found'; end if;
  if person.remaining_spins <= 0 then raise exception 'No spins remaining'; end if;
  -- Serialize draws across users; do not skip locked results or reveal a sequence.
  select remaining into slots from campaign_pool.state where singleton for update;
  if slots <= 0 then raise exception 'No eligible pool results remain'; end if;
  if slots is null or slots <> (select sum(remaining) from campaign_pool.entries) then
    raise exception 'Fixed-pool counts are inconsistent';
  end if;
  perform p.id from public.prizes p join campaign_pool.entries e on e.prize_id=p.id
    order by p.id for update of p;
  ticket := floor(random()*slots)::integer;
  for item in select outcome_id,remaining from campaign_pool.entries where remaining > 0 order by outcome_id loop
    if ticket < item.remaining then chosen := item.outcome_id; exit; end if;
    ticket := ticket - item.remaining;
  end loop;
  if chosen is null then raise exception 'No eligible pool result selected'; end if;
  select * into outcome from public.wheel_outcomes where id = chosen;
  update campaign_pool.entries set remaining=remaining-1 where outcome_id=chosen;
  update campaign_pool.state set remaining=remaining-1 where singleton;
  if outcome.prize_id is not null then
    update public.prizes set quantity=quantity-1 where id=outcome.prize_id and active and quantity>0
      returning * into prize;
    if not found then raise exception 'Prize no longer available'; end if;
    insert into public.wins(user_id,user_email,prize,prize_id,outcome_id,retail_value,
      sponsor_name,delivery_type,delivery_instructions,status)
    values (p_user_id,person.email,prize.name,prize.id,outcome.id,prize.retail_value,
      prize.sponsor_name,prize.delivery_type,prize.delivery_instructions,'Pending') returning id into won_id;
  end if;
  update public.profiles set remaining_spins=remaining_spins-1,updated_at=now() where id=p_user_id;
  insert into public.spin_history(user_id,outcome_id,won) values (p_user_id,outcome.id,prize.id is not null);
  return jsonb_build_object('outcomeId',outcome.id,'outcomeLabel',outcome.label,
    'remainingSpins',person.remaining_spins-1,'won',prize.id is not null,'spinAgain',false,'winId',won_id,
    'prize',case when prize.id is null then null else jsonb_build_object('id',prize.id,
      'name',prize.name,'retailValue',prize.retail_value,'sponsor',prize.sponsor_name) end);
end $$;
revoke all on function public.perform_spin(uuid) from public, anon, authenticated;
grant execute on function public.perform_spin(uuid) to service_role;

-- Admin-only, server-mediated monitoring; no future result sequence is exposed.
create function public.fixed_pool_status() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('remaining',s.remaining,'limit',1100,'entries',
    (select jsonb_agg(jsonb_build_object('outcomeId',e.outcome_id,'initial',e.initial_count,'remaining',e.remaining)
      order by e.outcome_id) from campaign_pool.entries e))
  from campaign_pool.state s where singleton;
$$;
revoke all on function public.fixed_pool_status() from public, anon, authenticated;
grant execute on function public.fixed_pool_status() to service_role;
commit;

-- Expected with today's stock: 1100 results, 115 prizes, 985 Try Again.
-- The actual counts below always reflect the inventory when this script runs.
select sum(initial_count) as total_results,
  sum(initial_count) filter (where prize_id is not null) as prize_results,
  sum(initial_count) filter (where prize_id is null) as try_again_results
from campaign_pool.entries;
