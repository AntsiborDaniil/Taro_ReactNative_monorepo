---
name: db-migration
description: Создать миграцию Supabase (таблица, колонка, RLS, RPC) и синхронизировать API. Использовать при любом изменении схемы БД.
---

# Миграция Supabase

1. Посмотри последние миграции: `ls supabase/migrations | tail -5`; новые таблицы/функции смотри по аналогии с `20260911180000_admin_role_support_tickets.sql` и `20260907120000_spread_credits_lava.sql`.
2. Файл `supabase/migrations/<YYYYMMDDHHMMSS>_<snake_name>.sql` (UTC-время, позже последнего). Применённые миграции не редактировать.
3. Шаблон новой таблицы:
   ```sql
   create table if not exists public.<name> (
     id uuid primary key default gen_random_uuid(),
     user_id uuid not null references auth.users(id) on delete cascade,
     created_at timestamptz not null default now()
   );
   create index if not exists <name>_user_id_idx on public.<name> (user_id);
   alter table public.<name> enable row level security;
   create policy "<name>_select_own" on public.<name>
     for select using (auth.uid() = user_id);
   ```
   RPC, меняющие лимиты/кредиты/роли: `security definer`, `set search_path = public`, `revoke ... from public, anon, authenticated`, `grant execute ... to service_role`. В plpgsql квалифицируй колонки алиасом таблицы (ambiguous column уже ловили).
4. Проверь локально: `pnpm supabase:reset`, затем `pnpm --filter tarot-ai-api-sevice supabase:types`.
5. Обнови сервисы API и `apps/api/src/dev/memoryBackend.ts`.
6. Предупреди пользователя: push в `main` с `supabase/**` сразу применяет миграцию к прод-БД через GitHub Actions.
