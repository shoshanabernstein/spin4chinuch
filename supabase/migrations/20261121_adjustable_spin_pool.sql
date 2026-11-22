-- Lets an administrator change how many results of one outcome remain in the fixed
-- spin pool during the campaign (e.g. add Try Again results or prize stock).
-- The spin sales limit now always equals the pool's total size, so the number of
-- spins for sale and the number of wheel results stay matched.

-- Total campaign size = every result the pool ever held (drawn + remaining).
create or replace function campaign_pool.spin_limit()
returns integer
language sql
stable
security definer
set search_path to ''
as $function$
  select coalesce(sum(initial_count), 0)::integer from campaign_pool.entries;
$function$;
revoke all on function campaign_pool.spin_limit() from public, anon, authenticated;

create or replace function public.spin_limit()
returns integer
language sql
stable
security definer
set search_path to ''
as $function$
  select campaign_pool.spin_limit();
$function$;
revoke all on function public.spin_limit() from public, anon, authenticated;
grant execute on function public.spin_limit() to service_role;

create or replace function public.fixed_pool_status()
returns jsonb
language sql
stable
security definer
set search_path to ''
as $function$
  select jsonb_build_object('remaining',s.remaining,'limit',campaign_pool.spin_limit(),'entries',
    (select jsonb_agg(jsonb_build_object('outcomeId',e.outcome_id,'initial',e.initial_count,'remaining',e.remaining)
      order by e.outcome_id) from campaign_pool.entries e))
  from campaign_pool.state s where singleton;
$function$;

-- Same as before, with the fixed 500 replaced by the pool's total size.
create or replace function public.credit_completed_payment_before_discounts(p_payment_intent_id text, p_user_id uuid, p_spins integer, p_amount integer)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  inserted_count integer;
  sold_spins bigint;
  spin_cap integer;
begin
  if exists (select 1 from campaign_reset_20261025.payment_logs where payment_intent_id = p_payment_intent_id) then return false; end if;
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
  spin_cap := campaign_pool.spin_limit();
  if sold_spins > spin_cap then
    raise exception 'The % spin limit has been reached', spin_cap;
  end if;

  update public.profiles
  set remaining_spins = remaining_spins + p_spins,
      total_spins = total_spins + p_spins,
      updated_at = now()
  where id = p_user_id;

  if not found then raise exception 'Profile not found'; end if;
  return true;
end;
$function$;

create or replace function public.complete_discount_checkout(p_id uuid, p_user_id uuid, p_payment_id text, p_amount integer)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare q campaign_discounts.quotes%rowtype; balance integer; sold bigint; spin_cap integer;
begin
  select discount_balance_cents into balance from public.profiles where id=p_user_id for update;
  if not found then raise exception 'Profile not found'; end if;
  select * into q from campaign_discounts.quotes where id=p_id and user_id=p_user_id for update;
  if not found or p_amount is distinct from q.amount then raise exception 'Invalid checkout quote'; end if;
  if p_payment_id is null or (q.amount=0 and p_payment_id <> 'free_'||q.id::text)
     or (q.amount>0 and p_payment_id not like 'pi\_%' escape '\') then raise exception 'Invalid payment ID'; end if;
  if q.completed then
    if q.payment_id is distinct from p_payment_id then raise exception 'Payment does not match completed checkout'; end if;
    return to_jsonb(q);
  end if;
  if balance < q.discount then raise exception 'Discount balance changed'; end if;
  lock table public.payment_logs in exclusive mode;
  select coalesce(sum(spins),0) into sold from public.payment_logs;
  spin_cap := campaign_pool.spin_limit();
  if sold + q.spins > spin_cap then raise exception 'The % spin limit has been reached', spin_cap; end if;
  insert into public.payment_logs(payment_intent_id,user_id,spins,amount)
  values(p_payment_id,p_user_id,q.spins,q.amount);
  update public.profiles set discount_balance_cents=discount_balance_cents-q.discount,
    remaining_spins=remaining_spins+q.spins,total_spins=total_spins+q.spins,updated_at=now() where id=p_user_id;
  update campaign_discounts.quotes set completed=true,payment_id=p_payment_id where id=q.id returning * into q;
  return to_jsonb(q);
end $function$;

-- Sets how many results of one outcome remain. The pool total, the outcome's
-- all-time count, the prize stock and the sales limit all move together.
create or replace function public.admin_adjust_pool_entry(p_outcome_id bigint, p_remaining integer)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  entry campaign_pool.entries%rowtype;
  outcome public.wheel_outcomes%rowtype;
  delta integer;
  sold bigint;
  new_limit integer;
begin
  if p_remaining is null or p_remaining < 0 or p_remaining > 100000 then
    raise exception 'Enter a whole number of 0 or more';
  end if;
  -- Same lock order as purchases (payment log) and spins (pool state, then prizes).
  lock table public.payment_logs in exclusive mode;
  perform 1 from campaign_pool.state where singleton for update;
  select * into entry from campaign_pool.entries where outcome_id = p_outcome_id for update;
  if not found then raise exception 'This outcome is not part of the spin pool'; end if;
  select * into outcome from public.wheel_outcomes where id = p_outcome_id;
  if outcome.type = 'loss' and outcome.prize_id is null and outcome.label = '?' then
    raise exception 'The ? discount slice has no results of its own; adjust Try Again instead';
  end if;

  delta := p_remaining - entry.remaining;
  if delta = 0 then return public.fixed_pool_status(); end if;

  new_limit := campaign_pool.spin_limit() + delta;
  select coalesce(sum(spins), 0) into sold from public.payment_logs;
  if new_limit < sold then
    raise exception '% spins have already been sold, so the wheel needs at least that many results in total', sold;
  end if;

  update campaign_pool.entries
  set remaining = p_remaining, initial_count = initial_count + delta
  where outcome_id = p_outcome_id;
  update campaign_pool.state set remaining = remaining + delta where singleton;
  if entry.prize_id is not null then
    -- The prize guard requires stock to equal the pool's remaining count.
    update public.prizes
    set quantity = p_remaining, original_quantity = coalesce(original_quantity, quantity) + delta
    where id = entry.prize_id;
  end if;
  return public.fixed_pool_status();
end $function$;
revoke all on function public.admin_adjust_pool_entry(bigint, integer) from public, anon, authenticated;
grant execute on function public.admin_adjust_pool_entry(bigint, integer) to service_role;

-- Sets the campaign's total number of spins. The difference is added to or taken
-- from the Try Again results, so prize counts stay the same.
create or replace function public.admin_set_spin_total(p_total integer)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  try_again campaign_pool.entries%rowtype;
  delta integer;
begin
  if p_total is null or p_total < 0 then raise exception 'Enter a whole number of 0 or more'; end if;
  -- Take locks in the same order as admin_adjust_pool_entry (payment log, then pool state).
  lock table public.payment_logs in exclusive mode;
  perform 1 from campaign_pool.state where singleton for update;
  select e.* into try_again from campaign_pool.entries e
    join public.wheel_outcomes o on o.id = e.outcome_id
    where o.type = 'loss' and o.prize_id is null and o.label <> '?'
    order by e.initial_count desc limit 1;
  if not found then raise exception 'There are no Try Again results to adjust'; end if;
  delta := p_total - campaign_pool.spin_limit();
  if try_again.remaining + delta < 0 then
    raise exception 'That is too few: only % Try Again results are left to remove, so the lowest possible total is %',
      try_again.remaining, campaign_pool.spin_limit() - try_again.remaining;
  end if;
  return public.admin_adjust_pool_entry(try_again.outcome_id, try_again.remaining + delta);
end $function$;
revoke all on function public.admin_set_spin_total(integer) from public, anon, authenticated;
grant execute on function public.admin_set_spin_total(integer) to service_role;
