-- Бесплатные карты периода: дня, недели и месяца — по одной на период.
--
-- Период считает сервер по своим часам (Europe/Moscow): день — с 00:00,
-- неделя — с понедельника, месяц — с 1-го числа. Строка вставляется ДО вызова
-- модели (уникальность по периоду = защита от накрутки и параллельных запросов),
-- результат пишется в payload — повторный запрос в том же периоде получает
-- сохранённую карту, а не новую. Перевод часов на устройстве ничего не даёт.

create table if not exists public.free_period_cards (
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('day', 'week', 'month')),
  period_start date not null,
  -- null — карта «в работе» (модель ещё отвечает); после ответа — {interpretation, card}.
  payload jsonb,
  created_at timestamptz not null default now(),
  primary key (user_id, kind, period_start)
);

create index if not exists free_period_cards_user_idx on public.free_period_cards (user_id, kind, period_start desc);

alter table public.free_period_cards enable row level security;
-- Только service_role (API); политик для anon/authenticated нет.
