-- Apply after deploying the app with 1,100-spin refund handling.
-- Preserve the existing transaction lock and payment replay protection.
begin;
set local lock_timeout = '5s';
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
