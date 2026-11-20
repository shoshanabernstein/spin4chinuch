-- Log of tax receipts sent to prize vendors, so the admin Tax Receipts page can
-- show which vendors already received one. Written only by server routes using
-- the service role; RLS is enabled with no policies, so clients cannot read it.
create table if not exists public.vendor_tax_receipts (
  id bigint generated always as identity primary key,
  vendor_key text not null,
  recipient_email text not null,
  donor_name text not null,
  business_name text,
  received_date date not null,
  description text not null,
  sent_at timestamptz not null default now(),
  sent_via text not null default 'website' check (sent_via in ('website', 'gmail')),
  email_id text,
  sent_by uuid references auth.users (id) on delete set null
);

create index if not exists vendor_tax_receipts_vendor_key_sent_at_idx
  on public.vendor_tax_receipts (vendor_key, sent_at desc);

alter table public.vendor_tax_receipts enable row level security;

-- Receipts already emailed by hand from the campaign Gmail on 2026-11-20.
insert into public.vendor_tax_receipts (vendor_key, recipient_email, donor_name, business_name, received_date, description, sent_at, sent_via)
values
  ('in memory of refael ben sarah faham', 'rachelfaham123@gmail.com', 'Rachel Faham', null, '2026-10-28',
   'three haircuts, one Pro Addiction hair treatment, and one set of semi-permanent hair extensions', '2026-11-20 18:30:00+00', 'gmail'),
  ('design by hinda', 'designbyhinda@gmail.com', 'Hinda Freidman', 'Design by Hinda', '2026-10-28',
   'one 1-hour design session', '2026-11-20 18:30:00+00', 'gmail'),
  ('chocodela', 'adela@chocodela.com', 'Adela Muller', 'Chocodela', '2026-10-28',
   'three $50 Chocodela gift cards', '2026-11-20 18:30:00+00', 'gmail');
