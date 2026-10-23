-- Apply in Supabase SQL Editor before deploying the matching application.
begin;
create table public.spin_requests (
  user_id uuid not null references public.profiles(id) on delete cascade,
  request_id uuid not null,
  result jsonb not null,
  created_at timestamptz not null default now(),
  primary key (user_id, request_id)
);
alter table public.spin_requests enable row level security;
revoke all on public.spin_requests from public, anon, authenticated;
grant select, insert on public.spin_requests to service_role;

-- Server-only invoker: use the existing trusted spin routines and permissions.
create function public.perform_spin_once(p_user_id uuid, p_request_id uuid, p_gift_cards boolean)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare saved jsonb;
begin
  if p_request_id is null or p_gift_cards is null then
    raise exception 'Missing spin request parameters';
  end if;
  -- Serialize requests for this user, including concurrent first submissions.
  -- The underlying spin function takes the same profile lock.
  perform 1 from public.profiles where id = p_user_id for update;
  if not found then raise exception 'Profile not found'; end if;
  select result into saved from public.spin_requests
    where user_id = p_user_id and request_id = p_request_id;
  if found then return saved || jsonb_build_object('replayed', true); end if;

  if p_gift_cards then
    saved := public.perform_spin_with_gift_cards(p_user_id);
  else
    saved := public.perform_spin(p_user_id);
  end if;
  insert into public.spin_requests(user_id, request_id, result)
    values (p_user_id, p_request_id, saved);
  return saved || jsonb_build_object('replayed', false);
end;
$$;
revoke all on function public.perform_spin_once(uuid, uuid, boolean) from public, anon, authenticated;
grant execute on function public.perform_spin_once(uuid, uuid, boolean) to service_role;
commit;
