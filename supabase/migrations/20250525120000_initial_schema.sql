-- Mindful Tarot — initial Supabase schema

create extension if not exists "pgcrypto";

-- ─── Profiles (1:1 with auth.users) ───────────────────────────────────────────

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_email_idx on public.profiles (email);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'name', '')
  )
  on conflict (id) do update
  set
    email = excluded.email,
    name = coalesce(nullif(excluded.name, ''), public.profiles.name),
    updated_at = now();
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ─── Daily tarot usage ───────────────────────────────────────────────────────

create table public.tarot_daily_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  count integer not null default 0 check (count >= 0),
  primary key (user_id, day)
);

create index tarot_daily_usage_user_day_idx on public.tarot_daily_usage (user_id, day desc);

-- ─── Spread history ────────────────────────────────────────────────────────────

create table public.spreads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  spread_key text not null,
  name text not null default '',
  category text,
  question text default '',
  interpretation text,
  cards_count integer not null default 0,
  pack_index integer not null default 0,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index spreads_user_created_idx on public.spreads (user_id, created_at desc);
create index spreads_user_spread_key_idx on public.spreads (user_id, spread_key);

create trigger spreads_set_updated_at
before update on public.spreads
for each row execute function public.set_updated_at();

-- ─── Favorite cards ────────────────────────────────────────────────────────────

create table public.favorite_cards (
  user_id uuid not null references auth.users (id) on delete cascade,
  card_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, card_id)
);

-- ─── User settings (appearance, deck, etc.) ──────────────────────────────────

create table public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create trigger user_settings_set_updated_at
before update on public.user_settings
for each row execute function public.set_updated_at();
