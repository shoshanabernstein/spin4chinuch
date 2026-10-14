begin;

-- Keep the backfill consistent with spins that decrement stock and record wins.
lock table public.prizes, public.wins in share row exclusive mode;

alter table public.prizes add column original_quantity integer;

-- Recover the initial allocation from remaining inventory and recorded awards.
-- Historical manual inventory changes or deleted wins may require correction.
update public.prizes p
set original_quantity = p.quantity + (
  select count(*)::integer from public.wins w where w.prize_id = p.id
);

alter table public.prizes
  alter column original_quantity set not null,
  add constraint prizes_original_quantity_nonnegative check (original_quantity >= 0);

-- Capture the initial inventory for all creation paths, including admin inserts.
-- Stock updates during a win never modify this separate value.
create function public.set_original_prize_quantity()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.original_quantity := new.quantity;
  return new;
end;
$$;

create trigger prizes_set_original_quantity
  before insert on public.prizes
  for each row execute function public.set_original_prize_quantity();

commit;
