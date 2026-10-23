-- Read-only. Run in Supabase SQL Editor as postgres.
-- API probes cannot reveal the complete policies, grants, or function bodies.
begin transaction read only;

select c.relname as object_name, c.relkind, c.relrowsecurity as rls_enabled,
       c.reloptions
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname in (
  'profiles', 'prizes', 'wins', 'payment_logs', 'spin_history',
  'wheel_outcomes', 'prize_contacts', 'prize_gift_cards', 'spin_requests',
  'public_winners', 'public_wheel_outcomes'
)
order by c.relname;

select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname in ('public', 'storage')
order by schemaname, tablename, policyname;

select table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public' and grantee in ('PUBLIC', 'anon', 'authenticated', 'service_role')
order by table_name, grantee, privilege_type;

select p.oid::regprocedure as function_name, p.prosecdef as security_definer,
       p.proconfig as settings, p.proacl as grants,
       has_function_privilege('anon', p.oid, 'execute') as anon_can_execute,
       has_function_privilege('authenticated', p.oid, 'execute') as signed_in_can_execute,
       has_function_privilege('service_role', p.oid, 'execute') as server_can_execute,
       pg_get_functiondef(p.oid) as definition
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname in (
  'perform_spin', 'perform_spin_once', 'perform_spin_with_gift_cards',
  'credit_completed_payment', 'sold_spin_count', 'is_admin',
  'claim_gift_card_email', 'finish_gift_card_email'
)
order by p.proname;

select tgrelid::regclass as table_name, tgname, pg_get_triggerdef(oid) as definition
from pg_trigger
where not tgisinternal and tgrelid in (
  'public.prizes'::regclass, 'public.wins'::regclass, 'auth.users'::regclass
)
order by table_name, tgname;

select id, public from storage.buckets order by id;
commit;
