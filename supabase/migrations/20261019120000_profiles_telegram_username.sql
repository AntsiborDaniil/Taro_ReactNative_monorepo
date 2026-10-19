-- Telegram username в профиле: в админке пользователя показываем как @username (или telegram id).
-- Обновляется API при каждом входе через Mini App (username в Telegram может меняться).

alter table public.profiles
  add column if not exists telegram_username text;

comment on column public.profiles.telegram_username is
  'Telegram username без @ (из initData Mini App, обновляется при каждом входе). NULL — username нет.';

-- Бэкфилл 1: из auth.users.raw_user_meta_data (пишется при создании TG-пользователя).
update public.profiles p
set telegram_username = nullif(ltrim(trim(u.raw_user_meta_data ->> 'telegram_username'), '@'), '')
from auth.users u
where u.id = p.id
  and p.telegram_username is null
  and nullif(ltrim(trim(u.raw_user_meta_data ->> 'telegram_username'), '@'), '') is not null;

-- Бэкфилл 2: из лидов бота (/start) по telegram_id — там username свежее на момент /start.
update public.profiles p
set telegram_username = nullif(ltrim(trim(ta.username), '@'), '')
from public.telegram_acquisition ta
where ta.telegram_id = p.telegram_id
  and p.telegram_username is null
  and nullif(ltrim(trim(ta.username), '@'), '') is not null;

-- Пользователь не может подменить telegram_username через RLS-политику profiles_update_own.
create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'authenticated' then
    new.role := old.role;
    new.spread_credits := old.spread_credits;
    new.telegram_id := old.telegram_id;
    new.telegram_username := old.telegram_username;
  end if;
  return new;
end;
$$;
