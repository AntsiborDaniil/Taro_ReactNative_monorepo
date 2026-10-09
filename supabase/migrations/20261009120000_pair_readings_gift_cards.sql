-- «Расклад на двоих» (pair_readings) и «Карта для друга» (gift_cards).
--
-- Пара: автор тянет 3 карты и зовёт партнёра по ссылке (72 часа, одноразовая —
-- первый вошедший занимает слот). Партнёр тянет свои 3 карты и сам решает, делиться
-- ли ими: при согласии сервер генерирует общее чтение. Если приглашение истекло без
-- партнёра, списанные ⚡ возвращаются автору (лениво, идемпотентно — флаг refunded).
-- Первая пара на аккаунт бесплатна (is_free), это гарантирует частичный unique-индекс.
--
-- Подарок: одна карта для друга с запиской, публичная ссылка живёт 30 дней.
--
-- Доступ только у service_role (API): RLS включён, политик для anon/authenticated нет.

create table if not exists public.pair_readings (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  -- Занимается атомарно первым вошедшим; при удалении партнёра слот освобождается в null.
  partner_id uuid references auth.users(id) on delete set null,
  question text not null default '',
  show_question boolean not null default false,
  inviter_name text not null default '',
  -- Язык автора: на нём генерируется общее чтение и пишутся уведомления.
  language text not null default 'ru',
  -- [{card_id, card, direction, label}] — по 3 карты у каждой стороны.
  author_cards jsonb not null,
  partner_cards jsonb,
  author_personal text not null default '',
  partner_personal text,
  pair_interpretation text,
  status text not null default 'waiting'
    check (status in ('waiting', 'drawn', 'shared', 'declined', 'revoked', 'expired')),
  is_free boolean not null default false,
  -- Сколько ⚡ списано и из каких источников ('daily' | 'credit') — для точного возврата.
  charged integer not null default 0,
  charge_sources jsonb not null default '[]'::jsonb,
  refunded boolean not null default false,
  joined_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pair_readings_author_idx on public.pair_readings (author_id, created_at desc);
create index if not exists pair_readings_partner_idx on public.pair_readings (partner_id, joined_at desc);
create index if not exists pair_readings_created_idx on public.pair_readings (created_at desc);
create index if not exists pair_readings_open_idx on public.pair_readings (status, expires_at);
-- Одна бесплатная пара на аккаунт: защита от гонки двух параллельных запросов.
create unique index if not exists pair_readings_one_free_per_author
  on public.pair_readings (author_id) where is_free;

alter table public.pair_readings enable row level security;
revoke all on public.pair_readings from anon, authenticated;

create table if not exists public.gift_cards (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_name text not null default '',
  occasion text not null default 'just_because'
    check (occasion in ('support', 'birthday', 'important_day', 'just_because')),
  note text not null default '',
  -- {card_id, card, direction}
  card jsonb not null,
  message text not null default '',
  language text not null default 'ru',
  -- Первое открытие получателем (не владельцем): по нему шлём уведомление один раз.
  opened_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists gift_cards_sender_idx on public.gift_cards (sender_id, created_at desc);
create index if not exists gift_cards_created_idx on public.gift_cards (created_at desc);

alter table public.gift_cards enable row level security;
revoke all on public.gift_cards from anon, authenticated;
