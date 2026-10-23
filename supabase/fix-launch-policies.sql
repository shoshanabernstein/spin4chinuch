-- Run as postgres in Supabase SQL Editor. No prize/user/payment rows are changed.
-- Replaces policies on ONLY these four tables with the app's intended rules.
begin;

do $$
declare item record;
begin
  for item in select tablename, policyname from pg_policies
    where schemaname = 'public'
      and tablename in ('profiles', 'prizes', 'wins', 'wheel_outcomes')
  loop
    execute format('drop policy %I on public.%I', item.policyname, item.tablename);
  end loop;
end $$;

alter table public.profiles enable row level security;
alter table public.prizes enable row level security;
alter table public.wins enable row level security;
alter table public.wheel_outcomes enable row level security;

-- Profile creation is performed by the auth trigger. Admin profile edits use
-- the server API. Browsers must never write role or balance fields directly.
revoke all on public.profiles, public.prizes, public.wins, public.wheel_outcomes
  from public, anon, authenticated;
grant select on public.profiles to authenticated;
grant select on public.prizes to anon, authenticated;
grant insert, update, delete on public.prizes to authenticated;
grant select, insert, update, delete on public.wins, public.wheel_outcomes to authenticated;

create policy profiles_select_own on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());

create policy prizes_public_read on public.prizes for select to anon, authenticated
  using ((active = true and quantity > 0) or public.is_admin());
create policy prizes_admin_write on public.prizes for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy wins_select_own on public.wins for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());
create policy wins_admin_write on public.wins for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy outcomes_admin_all on public.wheel_outcomes for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

commit;

-- Expected: exactly these six policies, no unconditional client write policies.
select tablename, policyname, roles, cmd, qual, with_check from pg_policies
where schemaname = 'public'
  and tablename in ('profiles', 'prizes', 'wins', 'wheel_outcomes')
order by tablename, policyname;
