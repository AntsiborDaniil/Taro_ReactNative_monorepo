-- «Первый раз бесплатно»: глубокий разбор (и зарезервировано под пару) — один раз на аккаунт.
--
-- Запись вставляется ДО вызова модели (primary key = защита от параллельных запросов):
-- вставилась — разбор бесплатный, слоты не списываем; конфликт — бесплатный уже использован.
-- При ошибке модели API удаляет запись и тем самым возвращает бесплатность.
-- Для 'pair' текущая логика — флаг is_free в pair_readings, здесь значение зарезервировано.

create table if not exists public.free_first_uses (
  user_id uuid not null references auth.users(id) on delete cascade,
  feature text not null check (feature in ('deep', 'pair')),
  used_at timestamptz not null default now(),
  primary key (user_id, feature)
);

alter table public.free_first_uses enable row level security;
-- Только service_role (API); политик для anon/authenticated нет.
