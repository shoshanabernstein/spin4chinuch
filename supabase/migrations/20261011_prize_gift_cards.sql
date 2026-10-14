-- Apply before enabling E_GIFT_CARDS_ENABLED. Existing perform_spin is unchanged.
begin;

create table public.prize_gift_cards (
  id uuid primary key default gen_random_uuid(),
  prize_id bigint not null references public.prizes(id) on delete restrict,
  filename text not null,
  storage_path text not null unique,
  sha256 text not null unique,
  created_at timestamptz not null default now(),
  win_id bigint unique references public.wins(id) on delete restrict,
  recipient text,
  prize_name text,
  image_url text,
  assigned_at timestamptz,
  first_attempt_at timestamptz,
  lease_until timestamptz,
  lease_token uuid,
  email_id text,
  sent_at timestamptz,
  last_error text
);
create index prize_gift_cards_available on public.prize_gift_cards(prize_id, created_at) where win_id is null;
alter table public.prize_gift_cards enable row level security;
revoke all on public.prize_gift_cards from public, anon, authenticated;
grant all on public.prize_gift_cards to service_role;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('prize-gift-cards', 'prize-gift-cards', false, 3145728, array['application/pdf']);
-- A restrictive policy also blocks access if the project already has a broad
-- permissive storage policy. Service role routes bypass RLS.
create policy gift_card_files_server_only on storage.objects as restrictive
for all to anon, authenticated
using (bucket_id <> 'prize-gift-cards')
with check (bucket_id <> 'prize-gift-cards');

create function public.reserve_prize_gift_card()
returns trigger language plpgsql security definer set search_path = public as $$
declare card_id uuid;
begin
  if current_setting('app.gift_card_spin', true) is distinct from 'on' then return new; end if;
  perform set_config('app.gift_card_win_id', new.id::text, true);
  if new.prize_id is null or nullif(trim(new.user_email), '') is null then return new; end if;
  select id into card_id from public.prize_gift_cards
    where prize_id = new.prize_id and win_id is null
    order by created_at, id for update skip locked limit 1;
  if card_id is not null then
    update public.prize_gift_cards set win_id = new.id, recipient = new.user_email,
      prize_name = new.prize, assigned_at = now(),
      image_url = (select image_url from public.prizes where id = new.prize_id)
      where id = card_id;
  end if;
  return new;
end;
$$;
revoke all on function public.reserve_prize_gift_card() from public, anon, authenticated;
create trigger reserve_prize_gift_card_after_win after insert on public.wins
for each row execute function public.reserve_prize_gift_card();

create function public.perform_spin_with_gift_cards(p_user_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare result jsonb;
begin
  perform set_config('app.gift_card_win_id', '', true);
  perform set_config('app.gift_card_spin', 'on', true);
  result := public.perform_spin(p_user_id);
  perform set_config('app.gift_card_spin', 'off', true);
  return result || jsonb_build_object('winId', nullif(current_setting('app.gift_card_win_id', true), '')::bigint);
end;
$$;
revoke all on function public.perform_spin_with_gift_cards(uuid) from public, anon, authenticated;
grant execute on function public.perform_spin_with_gift_cards(uuid) to service_role;

-- A lease prevents concurrent requests sending the same email. The PDF is never
-- returned to the available pool, even after cancellation or an uncertain send.
create function public.claim_gift_card_email(p_win_id bigint)
returns jsonb language plpgsql security definer set search_path = public as $$
declare card public.prize_gift_cards%rowtype; win_status text;
begin
  select status into win_status from public.wins where id = p_win_id for update;
  if win_status is distinct from 'Pending' then return null; end if;
  select * into card from public.prize_gift_cards where win_id = p_win_id for update;
  if not found or card.sent_at is not null or card.lease_until > now() then return null; end if;
  -- Resend retains idempotency keys for 24h. Stop ambiguous retries before expiry.
  if card.first_attempt_at < now() - interval '23 hours' then
    raise exception 'Email needs manual review in Resend before further delivery';
  end if;
  update public.prize_gift_cards set first_attempt_at = coalesce(first_attempt_at, now()),
    lease_until = now() + interval '5 minutes', lease_token = gen_random_uuid(), last_error = null
    where id = card.id returning * into card;
  return to_jsonb(card);
end;
$$;
revoke all on function public.claim_gift_card_email(bigint) from public, anon, authenticated;
grant execute on function public.claim_gift_card_email(bigint) to service_role;

create function public.finish_gift_card_email(p_win_id bigint, p_token uuid, p_email_id text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if nullif(p_email_id, '') is null then raise exception 'Missing email receipt'; end if;
  perform 1 from public.wins where id = p_win_id for update;
  update public.prize_gift_cards set email_id = p_email_id, sent_at = now(),
    lease_until = null, last_error = null
    where win_id = p_win_id and lease_token = p_token and sent_at is null;
  if not found then raise exception 'Email delivery lease changed'; end if;
  update public.wins set status = 'Fulfilled' where id = p_win_id and status = 'Pending';
end;
$$;
revoke all on function public.finish_gift_card_email(bigint, uuid, text) from public, anon, authenticated;
grant execute on function public.finish_gift_card_email(bigint, uuid, text) to service_role;

commit;
