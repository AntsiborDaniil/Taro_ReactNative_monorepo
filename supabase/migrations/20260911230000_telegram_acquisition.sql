-- Attribution from Telegram bot deep links (?start=ig_bio, yt_shorts, …)

alter table public.profiles
  add column if not exists acquisition_source text,
  add column if not exists acquisition_at timestamptz;

create index if not exists profiles_acquisition_source_idx
  on public.profiles (acquisition_source)
  where acquisition_source is not null;

create table if not exists public.telegram_acquisition (
  telegram_id bigint primary key,
  source text not null,
  username text,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists telegram_acquisition_source_idx
  on public.telegram_acquisition (source);

create index if not exists telegram_acquisition_created_at_idx
  on public.telegram_acquisition (created_at desc);

comment on table public.telegram_acquisition is
  'First-touch acquisition source from bot /start deep links (before Mini App profile exists).';

comment on column public.profiles.acquisition_source is
  'First-touch marketing source copied from telegram_acquisition or set via bot.';
