begin;

create table if not exists public.prize_contacts (
  prize_id bigint primary key references public.prizes(id) on delete cascade,
  contact_name text,
  contact_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.prize_contacts enable row level security;

drop policy if exists prize_contacts_admin_all on public.prize_contacts;
create policy prize_contacts_admin_all on public.prize_contacts for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

revoke all on table public.prize_contacts from anon;
grant select, insert, update, delete on table public.prize_contacts to authenticated;

commit;
