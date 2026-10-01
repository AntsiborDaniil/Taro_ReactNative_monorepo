---
paths:
  - "supabase/**"
---

# supabase — схема БД и Edge Functions

- Таблицы: `profiles` (связь с `auth.users`, `telegram_id`, `role`), `tarot_daily_usage`, `spreads` (payload в JSON), `favorite_cards`, `user_settings` (JSON), а также таблицы спред-кредитов/Lava, саппорт-тикетов и acquisition (см. миграции `2026091*`).
- RLS включён на всех пользовательских таблицах. API ходит с service role, RPC для лимитов и кредитов (`consume_tarot_daily_slot_for_user`, `get_tarot_daily_usage_for_user` и др.) — только для service role.
- Новая миграция: `supabase/migrations/<YYYYMMDDHHMMSS>_<snake_name>.sql`, timestamp позже последнего. **Уже применённые миграции не редактировать**, исправления — отдельной миграцией (пример: `20260910230000_fix_spread_credits_ambiguous.sql`).
- В каждой новой таблице: `enable row level security`, политики, `grant`, индексы по `user_id`. В plpgsql-функциях квалифицируй колонки, чтобы не было ambiguous (уже ловили такой баг).
- Локально: `pnpm supabase:start`, `pnpm supabase:reset` (накатывает всё заново), потом `pnpm --filter tarot-ai-api-sevice supabase:types`.
- **Push в `main` с изменениями в `supabase/**` сразу катит миграции в прод** (`.github/workflows/supabase-deploy.yml`). Перед коммитом миграции проверь её через `supabase db reset` локально.
- При изменении схемы обнови memory-бэкенд API (`apps/api/src/dev/memoryBackend.ts`), если меняется поведение сервисов.
- Edge Functions (`functions/*`, Deno) — `interpret`, `motivation-mood`, `motivation-habits`, общие хелперы в `_shared/`. Сейчас web ими **не пользуется** (AI идёт через BFF), держи их в рабочем состоянии, но основная логика живёт в `apps/api`.
