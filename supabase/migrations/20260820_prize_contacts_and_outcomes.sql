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

-- Move the original server-only contacts into the private, admin-only table.
insert into public.prize_contacts (prize_id, contact_name, contact_email)
select p.id, contacts.contact_name, contacts.contact_email
from public.prizes p
join (values
  ('Chocodela', 'Adela Muller', 'adela@chocodela.com'),
  ('Miriam Mizrachi', 'Miriam Mizrachi', 'mimizrahi@yahoo.com'),
  ('CNote Academy', 'Chayala Neahous', 'info@cnotestudiosnj.com'),
  ('Makeup by Sori', 'Sori Weinberger', 'sorieisenbach19@gmail.com'),
  ('Marcys', 'Chaim Stern', null),
  ('Massage by Devorah', 'Devorah', 'devorahlmt@gmail.com'),
  ('Whoopi', null, 'estie.whoopi@gmail.com'),
  ('Piccolino Baby Furniture', null, 'hello@piccolinobaby.com'),
  ('Linen & Lounge', null, 'hello@linenandlounge.co')
) as contacts(sponsor_name, contact_name, contact_email)
  on p.sponsor_name = contacts.sponsor_name
on conflict (prize_id) do nothing;

-- Backfill any prizes that were created before automatic outcome creation.
with value_range as (
  select greatest(coalesce(max(retail_value), 1), 1)::numeric as highest_value
  from public.prizes
  where active = true and quantity > 0 and retail_value > 0
)
insert into public.wheel_outcomes (label, type, prize_id, probability, active)
select
  p.name,
  'prize',
  p.id,
  greatest(
    1,
    round(100 * value_range.highest_value / greatest(coalesce(p.retail_value, value_range.highest_value), 1))::integer
  ),
  p.active
from public.prizes p, value_range
where not exists (
  select 1 from public.wheel_outcomes wo where wo.prize_id = p.id
);

create or replace function public.add_prize_wheel_outcome()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  highest_value numeric;
  outcome_weight integer;
begin
  select greatest(coalesce(max(retail_value), 1), 1)
  into highest_value
  from public.prizes
  where active = true and quantity > 0 and retail_value > 0;

  outcome_weight := greatest(
    1,
    round(100 * highest_value / greatest(coalesce(new.retail_value, highest_value), 1))::integer
  );

  insert into public.wheel_outcomes (label, type, prize_id, probability, active)
  select new.name, 'prize', new.id, outcome_weight, new.active
  where not exists (
    select 1 from public.wheel_outcomes where prize_id = new.id
  );

  return new;
end;
$$;

drop trigger if exists add_prize_wheel_outcome on public.prizes;
create trigger add_prize_wheel_outcome
  after insert on public.prizes
  for each row execute function public.add_prize_wheel_outcome();

commit;
