-- Run as postgres after deploying 500-spin refund handling.
-- Apply LAST, after fixed-pool and discount installation scripts.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';
lock table public.profiles, public.payment_logs in access exclusive mode;

do $$
declare
  fn record;
  definition text;
  removed integer;
  loss_id bigint;
begin
  if (select coalesce(sum(spins), 0) from public.payment_logs) > 500 then
    raise exception 'Cannot reduce the campaign below spins already sold';
  end if;
  -- Preserve installed discount wrappers, permissions, and replay protection.
  if to_regprocedure('public.credit_completed_payment(text,uuid,integer,integer)') is null then
    raise exception 'Install payment settlement before changing the cap';
  end if;
  for fn in select p.oid from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname in
      ('credit_completed_payment','credit_completed_payment_before_discounts','complete_discount_checkout')
  loop
    definition := pg_get_functiondef(fn.oid);
    if definition like '%1100%' then
      execute replace(definition, '1100', '500');
    elsif definition like '%2000%' then
      raise exception 'Apply the existing 1100-spin payment setup first';
    end if;
  end loop;

  if to_regnamespace('campaign_pool') is not null then
    lock table campaign_pool.state, campaign_pool.entries in access exclusive mode;
    select sum(initial_count)::integer - 500 into removed from campaign_pool.entries;
    if removed < 0 or removed is null then
      raise exception 'Unexpected fixed-pool size';
    end if;
    select e.outcome_id into strict loss_id from campaign_pool.entries e
      join public.wheel_outcomes o on o.id=e.outcome_id
      where e.prize_id is null and o.type='loss' and lower(trim(o.label))='try again';
    if (select remaining from campaign_pool.entries where outcome_id=loss_id) < removed then
      raise exception 'Not enough unused Try Again results to shrink the pool safely';
    end if;
    update campaign_pool.entries set initial_count=initial_count-removed,
      remaining=remaining-removed where outcome_id=loss_id;
    update campaign_pool.state set remaining=remaining-removed where singleton;
    definition := pg_get_functiondef('public.fixed_pool_status()'::regprocedure);
    execute replace(definition, '''limit'',1100', '''limit'',500');
  end if;
end $$;
commit;
