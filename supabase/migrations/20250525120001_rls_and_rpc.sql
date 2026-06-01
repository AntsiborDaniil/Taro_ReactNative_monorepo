-- RLS + server RPC helpers

alter table public.profiles enable row level security;
alter table public.tarot_daily_usage enable row level security;
alter table public.spreads enable row level security;
alter table public.favorite_cards enable row level security;
alter table public.user_settings enable row level security;

-- profiles
create policy "profiles_select_own"
on public.profiles for select
using (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- tarot_daily_usage
create policy "tarot_daily_usage_select_own"
on public.tarot_daily_usage for select
using (auth.uid() = user_id);

-- spreads
create policy "spreads_select_own"
on public.spreads for select
using (auth.uid() = user_id);

create policy "spreads_insert_own"
on public.spreads for insert
with check (auth.uid() = user_id);

create policy "spreads_update_own"
on public.spreads for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "spreads_delete_own"
on public.spreads for delete
using (auth.uid() = user_id);

-- favorite_cards
create policy "favorite_cards_select_own"
on public.favorite_cards for select
using (auth.uid() = user_id);

create policy "favorite_cards_insert_own"
on public.favorite_cards for insert
with check (auth.uid() = user_id);

create policy "favorite_cards_delete_own"
on public.favorite_cards for delete
using (auth.uid() = user_id);

-- user_settings
create policy "user_settings_select_own"
on public.user_settings for select
using (auth.uid() = user_id);

create policy "user_settings_insert_own"
on public.user_settings for insert
with check (auth.uid() = user_id);

create policy "user_settings_update_own"
on public.user_settings for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- ─── Atomic daily slot consume (service role / Edge Functions) ────────────────

create or replace function public.consume_tarot_daily_slot_for_user(
  p_user_id uuid,
  p_limit integer default 10
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_day date := (timezone('utc', now()))::date;
  v_count integer;
begin
  if p_user_id is null then
    raise exception 'user_id required';
  end if;

  insert into public.tarot_daily_usage (user_id, day, count)
  values (p_user_id, v_day, 0)
  on conflict (user_id, day) do nothing;

  select count into v_count
  from public.tarot_daily_usage
  where user_id = p_user_id and day = v_day
  for update;

  if v_count >= p_limit then
    return jsonb_build_object(
      'ok', false,
      'used', v_count,
      'limit', p_limit,
      'day', v_day
    );
  end if;

  update public.tarot_daily_usage
  set count = count + 1
  where user_id = p_user_id and day = v_day
  returning count into v_count;

  return jsonb_build_object(
    'ok', true,
    'used', v_count,
    'limit', p_limit,
    'day', v_day
  );
end;
$$;

revoke all on function public.consume_tarot_daily_slot_for_user(uuid, integer) from public;
grant execute on function public.consume_tarot_daily_slot_for_user(uuid, integer) to service_role;

-- ─── Read daily usage (service role) ─────────────────────────────────────────

create or replace function public.get_tarot_daily_usage_for_user(
  p_user_id uuid,
  p_limit integer default 10
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_day date := (timezone('utc', now()))::date;
  v_count integer;
begin
  select count into v_count
  from public.tarot_daily_usage
  where user_id = p_user_id and day = v_day;

  v_count := coalesce(v_count, 0);

  return jsonb_build_object(
    'used', v_count,
    'limit', p_limit,
    'day', v_day
  );
end;
$$;

revoke all on function public.get_tarot_daily_usage_for_user(uuid, integer) from public;
grant execute on function public.get_tarot_daily_usage_for_user(uuid, integer) to service_role;
