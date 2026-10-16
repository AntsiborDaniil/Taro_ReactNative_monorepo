-- Единый реестр подписчиков бота: все, кто запускал бота (/start, любое сообщение)
-- или входил в Mini App через Telegram. Источник адресатов ежедневной рассылки 10:00 МСК.
-- Раньше рассылка шла только по profiles.telegram_id — тем, кто нажал /start,
-- но не открыл Mini App, не доходило ничего.

create table if not exists public.telegram_bot_subscribers (
  telegram_id bigint primary key,
  language_code text,
  started_at timestamptz not null default now(),
  last_interaction_at timestamptz,
  -- Бот заблокирован / чат недоступен: больше не шлём, пока человек не напишет снова.
  blocked_at timestamptz,
  -- День слота (сутки с 10:00 МСК, tarot_slot_day), за который рассылка «захвачена»
  -- (условный UPDATE — защита от дублей при параллельных прогонах).
  daily_nudge_sent_on date,
  -- Когда сообщение реально ушло (для админской сводки).
  last_nudge_at timestamptz
);

alter table public.telegram_bot_subscribers enable row level security;
-- Политик нет: доступ только у service_role (API), anon/authenticated закрыты.
revoke all on public.telegram_bot_subscribers from anon, authenticated;
grant all on public.telegram_bot_subscribers to service_role;

-- Выборка кандидатов рассылки: не заблокированные и ещё не получившие за день слота.
create index if not exists telegram_bot_subscribers_nudge_idx
  on public.telegram_bot_subscribers (daily_nudge_sent_on)
  where blocked_at is null;

create index if not exists telegram_bot_subscribers_last_nudge_idx
  on public.telegram_bot_subscribers (last_nudge_at)
  where last_nudge_at is not null;

comment on table public.telegram_bot_subscribers is
  'Подписчики Telegram-бота (писать в ЛС можно только начавшим диалог). Адресаты рассылки 10:00 МСК.';

-- Backfill 1: все профили с telegram_id (вошли через Mini App).
-- daily_nudge_sent_on = null → сегодняшний прогон рассылки дойдёт и до них.
insert into public.telegram_bot_subscribers (telegram_id, started_at)
select p.telegram_id, coalesce(p.created_at, now())
from public.profiles p
where p.telegram_id is not null
on conflict (telegram_id) do nothing;

-- Backfill 2: лиды с /start по deep-link меткам, ещё без профиля.
insert into public.telegram_bot_subscribers (telegram_id, started_at)
select a.telegram_id, a.created_at
from public.telegram_acquisition a
on conflict (telegram_id) do nothing;

-- Прежняя отметка «уже слали сегодня» с profiles — переносим, чтобы не продублировать
-- сообщение тем, кто получил его до выкладки.
update public.telegram_bot_subscribers s
set daily_nudge_sent_on = p.daily_free_nudge_sent_on
from public.profiles p
where p.telegram_id = s.telegram_id
  and p.daily_free_nudge_sent_on is not null;
