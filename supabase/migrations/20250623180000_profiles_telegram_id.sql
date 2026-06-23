-- Telegram Mini App: link profiles to Telegram user id

alter table public.profiles
  add column if not exists telegram_id bigint;

create unique index if not exists profiles_telegram_id_uidx
  on public.profiles (telegram_id)
  where telegram_id is not null;
