-- ONE-TIME installation, as postgres, AFTER deploying the matching app.
-- Deployment alone leaves discounts inactive. This transaction activates them.
-- Never reset campaign data or existing results. A busy database will fail the
-- short lock timeout safely; retry the unchanged script during a quiet moment.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';
lock table public.profiles, public.payment_logs, public.wheel_outcomes,
  public.spin_history, public.spin_requests in access exclusive mode;
create schema campaign_discounts;
revoke all on schema campaign_discounts from public, anon, authenticated, service_role;
alter table public.profiles add column discount_balance_cents integer not null default 0
  check (discount_balance_cents >= 0);
-- Profiles already have SELECT-only access for ordinary account holders.
revoke update on public.profiles from anon, authenticated;

create table campaign_discounts.quotes (
  id uuid primary key,
  user_id uuid not null references public.profiles(id),
  spins integer not null check (spins between 1 and 100),
  package_id text not null,
  subtotal integer not null check (subtotal > 0),
  discount integer not null check (discount >= 0 and discount <= subtotal),
  amount integer not null check (amount = subtotal - discount),
  payment_id text unique,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  email_started_at timestamptz,
  email_to text,
  email_id text
);
create index quotes_user_id on campaign_discounts.quotes(user_id);
create table campaign_discounts.awards (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id),
  amount integer not null check (amount in (100,200,300,400)),
  created_at timestamptz not null default now()
);
create index awards_user_id on campaign_discounts.awards(user_id);
alter table campaign_discounts.quotes enable row level security;
alter table campaign_discounts.awards enable row level security;
revoke all on all tables in schema campaign_discounts from public, anon, authenticated, service_role;

-- Add a visible slice with zero pool slots. Actual prize draws still consume
-- the original pool; a conditional 2/3 of loss results become discount results.
drop trigger fixed_pool_outcome_guard on public.wheel_outcomes;
with added as (
  insert into public.wheel_outcomes(label,type,prize_id,active,probability)
  values ('?','loss',null,true,1) returning id
)
insert into campaign_pool.entries(outcome_id,prize_id,initial_count,remaining)
select id,null,0,0 from added;
create trigger fixed_pool_outcome_guard before insert or update or delete on public.wheel_outcomes
for each row execute function campaign_pool.guard_outcome();

alter table public.payment_logs drop constraint payment_logs_amount_positive;
alter table public.payment_logs add constraint payment_logs_amount_nonnegative check (amount >= 0);

-- Keep old payment validation and archived-payment replay protection. Enforce
-- one lock order for old/new credit functions: profile first, then payment logs.
alter function public.credit_completed_payment(text,uuid,integer,integer)
rename to credit_completed_payment_before_discounts;
revoke all on function public.credit_completed_payment_before_discounts(text,uuid,integer,integer)
from public, anon, authenticated, service_role;
create function public.credit_completed_payment(p_payment_intent_id text,p_user_id uuid,p_spins integer,p_amount integer)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from public.profiles where id=p_user_id for update;
  if not found then raise exception 'Profile not found'; end if;
  return public.credit_completed_payment_before_discounts(p_payment_intent_id,p_user_id,p_spins,p_amount);
end $$;

create function public.discount_balance(p_user_id uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('enabled',true,'balanceCents',discount_balance_cents)
  from public.profiles where id=p_user_id;
$$;

create function public.create_discount_quote(p_id uuid,p_user_id uuid,p_spins integer,p_package_id text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare q campaign_discounts.quotes%rowtype; balance integer; gross integer;
begin
  select discount_balance_cents into balance from public.profiles where id=p_user_id for update;
  if not found then raise exception 'Profile not found'; end if;
  select * into q from campaign_discounts.quotes where id=p_id;
  if found then
    if q.user_id <> p_user_id or q.spins <> p_spins or q.package_id <> p_package_id then
      raise exception 'Checkout request does not match';
    end if;
    return to_jsonb(q);
  end if;
  if p_spins is null or p_spins not between 1 and 100 then raise exception 'Invalid spin quantity'; end if;
  gross := case when p_package_id='individual' then p_spins*1800
    when p_package_id='three-spins' and p_spins=3 then 4500
    when p_package_id='six-spins' and p_spins=6 then 8000 else null end;
  if gross is null or p_id is null then raise exception 'Invalid package'; end if;
  insert into campaign_discounts.quotes(id,user_id,spins,package_id,subtotal,discount,amount)
  values(p_id,p_user_id,p_spins,p_package_id,gross,least(balance,gross),greatest(gross-balance,0)) returning * into q;
  return to_jsonb(q);
end $$;

create function public.get_discount_quote(p_id uuid,p_user_id uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select to_jsonb(q) from campaign_discounts.quotes q where id=p_id and user_id=p_user_id;
$$;

create function public.complete_discount_checkout(p_id uuid,p_user_id uuid,p_payment_id text,p_amount integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare q campaign_discounts.quotes%rowtype; balance integer; sold bigint;
begin
  select discount_balance_cents into balance from public.profiles where id=p_user_id for update;
  if not found then raise exception 'Profile not found'; end if;
  select * into q from campaign_discounts.quotes where id=p_id and user_id=p_user_id for update;
  if not found or p_amount is distinct from q.amount then raise exception 'Invalid checkout quote'; end if;
  if p_payment_id is null or (q.amount=0 and p_payment_id <> 'free_'||q.id::text)
     or (q.amount>0 and p_payment_id not like 'pi\_%' escape '\') then raise exception 'Invalid payment ID'; end if;
  if q.completed then
    if q.payment_id is distinct from p_payment_id then raise exception 'Payment does not match completed checkout'; end if;
    return to_jsonb(q);
  end if;
  if balance < q.discount then raise exception 'Discount balance changed'; end if;
  lock table public.payment_logs in exclusive mode;
  select coalesce(sum(spins),0) into sold from public.payment_logs;
  if sold + q.spins > 1100 then raise exception 'The 1100 spin limit has been reached'; end if;
  insert into public.payment_logs(payment_intent_id,user_id,spins,amount)
  values(p_payment_id,p_user_id,q.spins,q.amount);
  update public.profiles set discount_balance_cents=discount_balance_cents-q.discount,
    remaining_spins=remaining_spins+q.spins,total_spins=total_spins+q.spins,updated_at=now() where id=p_user_id;
  update campaign_discounts.quotes set completed=true,payment_id=p_payment_id where id=q.id returning * into q;
  return to_jsonb(q);
end $$;

-- Free orders have no Stripe webhook. Their confirmation email uses the same
-- durable receipt / bounded provider-key retry policy as paid confirmations.
create function public.free_discount_email(p_id uuid,p_user_id uuid,p_email text,p_receipt text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare q campaign_discounts.quotes%rowtype;
begin
  select * into q from campaign_discounts.quotes
    where id=p_id and user_id=p_user_id and completed and amount=0 for update;
  if not found then raise exception 'Completed free purchase not found'; end if;
  if q.email_started_at is null then
    update campaign_discounts.quotes set email_started_at=now(),email_to=p_email where id=q.id;
  end if;
  if p_receipt is not null then update campaign_discounts.quotes set email_id=p_receipt where id=q.id; end if;
  select * into q from campaign_discounts.quotes where id=p_id;
  return to_jsonb(q);
end $$;

revoke all on function public.credit_completed_payment(text,uuid,integer,integer),
  public.discount_balance(uuid),public.create_discount_quote(uuid,uuid,integer,text),
  public.get_discount_quote(uuid,uuid),public.complete_discount_checkout(uuid,uuid,text,integer),
  public.free_discount_email(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.credit_completed_payment(text,uuid,integer,integer),
  public.discount_balance(uuid),public.create_discount_quote(uuid,uuid,integer,text),
  public.get_discount_quote(uuid,uuid),public.complete_discount_checkout(uuid,uuid,text,integer),
  public.free_discount_email(uuid,uuid,text,text) to service_role;

-- The updated fixed-pool draw is appended below. All changes commit together.
create or replace function public.perform_spin(p_user_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  person public.profiles%rowtype;
  outcome public.wheel_outcomes%rowtype;
  prize public.prizes%rowtype;
  slots integer;
  ticket integer;
  chosen bigint;
  item record;
  won_id bigint;
  discount_award integer := 0;
  roll integer;
begin
  select * into person from public.profiles where id = p_user_id for update;
  if not found then raise exception 'Profile not found'; end if;
  if person.remaining_spins <= 0 then raise exception 'No spins remaining'; end if;
  -- Serialize draws across users; do not skip locked results or reveal a sequence.
  select remaining into slots from campaign_pool.state where singleton for update;
  if slots <= 0 then raise exception 'No eligible pool results remain'; end if;
  if slots is null or slots <> (select sum(remaining) from campaign_pool.entries) then
    raise exception 'Fixed-pool counts are inconsistent';
  end if;
  perform p.id from public.prizes p join campaign_pool.entries e on e.prize_id=p.id
    order by p.id for update of p;
  ticket := floor(random()*slots)::integer;
  for item in select outcome_id,remaining from campaign_pool.entries where remaining > 0 order by outcome_id loop
    if ticket < item.remaining then chosen := item.outcome_id; exit; end if;
    ticket := ticket - item.remaining;
  end loop;
  if chosen is null then raise exception 'No eligible pool result selected'; end if;
  select * into outcome from public.wheel_outcomes where id = chosen;
  update campaign_pool.entries set remaining=remaining-1 where outcome_id=chosen;
  update campaign_pool.state set remaining=remaining-1 where singleton;
  if outcome.prize_id is null and random() < (2.0/3.0) then
    roll := floor(random()*10)::integer;
    discount_award := case when roll<4 then 100 when roll<7 then 200 when roll<9 then 300 else 400 end;
    select * into strict outcome from public.wheel_outcomes
      where label='?' and type='loss' and prize_id is null and active;
    insert into campaign_discounts.awards(user_id,amount) values(p_user_id,discount_award);
    update public.profiles set discount_balance_cents=discount_balance_cents+discount_award where id=p_user_id;
  end if;
  if outcome.prize_id is not null then
    update public.prizes set quantity=quantity-1 where id=outcome.prize_id and active and quantity>0
      returning * into prize;
    if not found then raise exception 'Prize no longer available'; end if;
    insert into public.wins(user_id,user_email,prize,prize_id,outcome_id,retail_value,
      sponsor_name,delivery_type,delivery_instructions,status)
    values (p_user_id,person.email,prize.name,prize.id,outcome.id,prize.retail_value,
      prize.sponsor_name,prize.delivery_type,prize.delivery_instructions,'Pending') returning id into won_id;
  end if;
  update public.profiles set remaining_spins=remaining_spins-1,updated_at=now() where id=p_user_id;
  insert into public.spin_history(user_id,outcome_id,won) values (p_user_id,outcome.id,prize.id is not null);
  return jsonb_build_object('outcomeId',outcome.id,'outcomeLabel',outcome.label,
    'discountAwardCents',discount_award,'remainingSpins',person.remaining_spins-1,'won',prize.id is not null,'spinAgain',false,'winId',won_id,
    'prize',case when prize.id is null then null else jsonb_build_object('id',prize.id,
      'name',prize.name,'retailValue',prize.retail_value,'sponsor',prize.sponsor_name) end);
end $$;
revoke all on function public.perform_spin(uuid) from public, anon, authenticated;
grant execute on function public.perform_spin(uuid) to service_role;


commit;
