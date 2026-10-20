begin;

-- Optional and separate from the existing contact email. Existing prizes do
-- not send sponsor notifications until an administrator sets this address.
-- The existing admin-only RLS policy on prize_contacts covers this column.
alter table public.prize_contacts
  add column if not exists notification_email text;

comment on column public.prize_contacts.notification_email is
  'Optional recipient of winner details for wins without an assigned gift-card PDF.';

commit;
