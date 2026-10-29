-- ONE-TIME reset. Run in Supabase SQL Editor as postgres with checkout/spinning paused.
-- Archives all affected rows in a private schema before changing anything.
-- No Stripe refunds are issued. Keep the archive: it prevents old payment replays.
-- Already delivered/assigned gift cards are archived, not put back into circulation.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';
lock table public.profiles, public.prizes, public.wins, public.spin_history, public.payment_logs, public.spin_requests, public.prize_gift_cards, public.wheel_outcomes in access exclusive mode;
create schema campaign_reset_20261025;
revoke all on schema campaign_reset_20261025 from public, anon, authenticated;
create table campaign_reset_20261025.profiles as table public.profiles;
alter table campaign_reset_20261025.profiles enable row level security;
revoke all on campaign_reset_20261025.profiles from public, anon, authenticated;
create table campaign_reset_20261025.prizes as table public.prizes;
alter table campaign_reset_20261025.prizes enable row level security;
revoke all on campaign_reset_20261025.prizes from public, anon, authenticated;
create table campaign_reset_20261025.wins as table public.wins;
alter table campaign_reset_20261025.wins enable row level security;
revoke all on campaign_reset_20261025.wins from public, anon, authenticated;
create table campaign_reset_20261025.spin_history as table public.spin_history;
alter table campaign_reset_20261025.spin_history enable row level security;
revoke all on campaign_reset_20261025.spin_history from public, anon, authenticated;
create table campaign_reset_20261025.payment_logs as table public.payment_logs;
alter table campaign_reset_20261025.payment_logs enable row level security;
revoke all on campaign_reset_20261025.payment_logs from public, anon, authenticated;
create table campaign_reset_20261025.spin_requests as table public.spin_requests;
alter table campaign_reset_20261025.spin_requests enable row level security;
revoke all on campaign_reset_20261025.spin_requests from public, anon, authenticated;
create table campaign_reset_20261025.prize_gift_cards as table public.prize_gift_cards;
alter table campaign_reset_20261025.prize_gift_cards enable row level security;
revoke all on campaign_reset_20261025.prize_gift_cards from public, anon, authenticated;
create table campaign_reset_20261025.wheel_outcomes as table public.wheel_outcomes;
alter table campaign_reset_20261025.wheel_outcomes enable row level security;
revoke all on campaign_reset_20261025.wheel_outcomes from public, anon, authenticated;
create unique index archived_payment_intents_20261025 on campaign_reset_20261025.payment_logs(payment_intent_id);

-- Restore original prize inventory; retain each prize's configured active state.
update public.prizes p set quantity = coalesce(p.original_quantity,
  p.quantity + (select count(*)::integer from public.wins w where w.prize_id = p.id));
-- Preserve configured odds if an inventory update trigger recalculated them.
update public.wheel_outcomes o set probability = saved.probability, active = saved.active
from campaign_reset_20261025.wheel_outcomes saved where saved.id = o.id;
delete from public.prize_gift_cards where win_id is not null;
delete from public.wins;
delete from public.spin_history;
delete from public.spin_requests;
delete from public.payment_logs;
update public.profiles set remaining_spins = 0, total_spins = 0, updated_at = now();

CREATE OR REPLACE FUNCTION public.credit_completed_payment(p_payment_intent_id text, p_user_id uuid, p_spins integer, p_amount integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  inserted_count integer;
  sold_spins bigint;
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
  if sold_spins > 1100 then
    raise exception 'The 1100 spin limit has been reached';
  end if;

  update public.profiles
  set remaining_spins = remaining_spins + p_spins,
      total_spins = total_spins + p_spins,
      updated_at = now()
  where id = p_user_id;

  if not found then raise exception 'Profile not found'; end if;
  return true;
end;
$function$
;

revoke all on function public.credit_completed_payment(text, uuid, integer, integer) from public, anon, authenticated;
grant execute on function public.credit_completed_payment(text, uuid, integer, integer) to service_role;
commit;

-- Expected: 0, 0, 0, 0; old purchases remain in the private archive.
select public.sold_spin_count() as sold_spins,
  (select coalesce(sum(remaining_spins), 0) from public.profiles) as available_user_spins,
  (select count(*) from public.wins) as wins,
  (select count(*) from public.spin_history) as spin_history;
