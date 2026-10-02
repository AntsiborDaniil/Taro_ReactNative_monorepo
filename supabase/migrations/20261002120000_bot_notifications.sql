-- Bot notifications: last seen + daily free nudge + checkout return path

alter table public.profiles
  add column if not exists last_seen_at timestamptz,
  add column if not exists daily_free_nudge_sent_on date;

comment on column public.profiles.last_seen_at is
  'Последний заход в приложение (например /auth/me). Для daily-free nudge.';
comment on column public.profiles.daily_free_nudge_sent_on is
  'Календарный день (Europe/Moscow), когда уже слали «бесплатный расклад доступен».';

create index if not exists profiles_daily_free_nudge_idx
  on public.profiles (daily_free_nudge_sent_on)
  where telegram_id is not null;

alter table public.lava_checkouts
  add column if not exists return_path text;

comment on column public.lava_checkouts.return_path is
  'Путь Mini App (например /spreads), куда вернуть после оплаты.';

-- Одноразовые флаги (broadcast на деплой и т.п.)
create table if not exists public.bot_notify_state (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.bot_notify_state enable row level security;
-- Только service_role (API); RLS без политик для anon/authenticated.

create or replace function public.touch_profile_last_seen(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set last_seen_at = now()
  where profiles.id = p_user_id;
end;
$$;

revoke all on function public.touch_profile_last_seen(uuid) from public, anon, authenticated;
grant execute on function public.touch_profile_last_seen(uuid) to service_role;
