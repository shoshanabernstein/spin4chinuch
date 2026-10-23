# Connected database launch audit — October 21, 2026

Read-only checks used the configured service-role and anonymous API clients.
No records, policies, or production configuration were changed.

## Confirmed

- All seven expected payment, spin, and gift-card RPC names are exposed to the
  server, including the newly applied `perform_spin_once`.
- `spin_requests` exists and has zero rows. Anonymous SELECT and execution of
  `perform_spin_once` both return permission denied.
- Anonymous reads of profiles, wins, payments, and spin history return zero rows.
  Profiles, payments, and history contain records when queried by the server.
  Zero visible rows alone does not prove every policy is correct.
- Anonymous SELECT on prize contacts and gift-card records is denied.
- `prize_contacts.notification_email` exists.
- Gift-card and site-settings buckets are private; prize logos are public.
- There are 8 uploaded gift cards, 0 wins, 13 payment records, 48 spin-history
  records, and 72 purchased spins according to `sold_spin_count`.

## Outstanding

1. `prizes.original_quantity` is missing (Postgres error 42703). Review the
   existing `20261007_original_prize_quantity.sql` before applying it: its backfill
   uses remaining quantity plus recorded wins, and deleted wins cannot be
   reconstructed. Confirm initial prize allocations against inventory records.
2. Anonymous clients can SELECT base `wheel_outcomes` rows including probability
   weights. The public app uses a server API that omits these fields. Inspect
   policies and grants before tightening access, preserving admin access and the
   intended public display endpoints. This is a difference from the intended
   admin-only base-table access, not evidence that users can modify outcomes.
3. Earlier payment and spin-history records still exist. They affect sales-cap
   accounting. Do not delete payment records or balances without reconciling
   Stripe and deciding which purchases were tests versus real donations.

## Checks requiring SQL access or staging accounts

Run `supabase/launch-permissions-audit.sql` in SQL Editor for exact policies,
function definitions, trigger configuration, and role permissions. The Data API
does not expose these catalogs. No direct SQL or Supabase management connection
is available in this session.

Verify ordinary signed-in users cannot read another user's data, alter their
own role or spin balance, access admin controls, or fetch gift-card files. These
checks need controlled signed-in staging accounts; anonymous checks do not
establish authenticated-user isolation. Verify simultaneous requests with
separate database connections before public launch.

## Policy results supplied by user

The full public policy listing confirmed legacy permissive policies on profiles,
prizes and wins. They allow signed-in users to read other profiles/wins, update
profiles (including roles and balances), modify prize inventory, and insert wins.
These are launch blockers. `supabase/fix-launch-policies.sql` replaces the policies
on these four tables (including wheel_outcomes), enables RLS, and narrows grants.
It does not modify stored data or the existing admin-check function. Profile
creation remains the auth trigger's responsibility; admin profile edits use the
server API. Public wheel display uses the server API, while admin wheel edits
continue through authenticated admin policies.

Run that file as postgres and share its six resulting policy rows. It is tested
locally in PGlite, including attempts to escalate roles, inflate balances, forge
wins, change inventory, read another user's data, and preserve admin/server access.
Production application and exact function permissions still require verification.
Because profile roles were previously client-writable, review existing admin
accounts against known authorized administrators; the policy fix cannot establish
whether any historical profile changes were legitimate.
