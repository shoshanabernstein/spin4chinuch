-- Log of tax receipts sent to purchasing users, so the admin Tax Receipts page can
-- show who already received one. Written only by server routes using the service
-- role; RLS is enabled with no policies, so clients cannot read it.
create table if not exists public.user_tax_receipts (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users (id) on delete set null,
  recipient_email text not null,
  donor_name text not null,
  period text not null,
  total_cents integer not null,
  prize_value_cents integer not null default 0,
  deductible_cents integer not null,
  sent_at timestamptz not null default now(),
  email_id text,
  sent_by uuid references auth.users (id) on delete set null
);

create index if not exists user_tax_receipts_user_id_sent_at_idx
  on public.user_tax_receipts (user_id, sent_at desc);

alter table public.user_tax_receipts enable row level security;
