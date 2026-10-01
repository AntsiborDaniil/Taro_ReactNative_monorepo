# CLAUDE.md — Mindful Tarot monorepo

Таро-приложение: AI-интерпретация раскладов, настроение/привычки, Telegram Mini App, платные спред-кредиты (Lava.top). Доки и комментарии в коде — на русском.

Детали по пакетам лежат в `.claude/rules/*.md` и подгружаются автоматически при работе с файлами пакета (web, api, supabase, bot, admin). Типовые задачи — skills в `.claude/skills/` (`web-screen`, `api-endpoint`, `db-migration`).

## Пакеты (pnpm workspace, Node 22+, pnpm 10)

| Путь | `--filter` | Что | Деплой |
|------|-----------|-----|--------|
| `apps/web` | `web` | Фронт: Expo 53 / RN Web, React 19; `apps/web/api/` — Vercel serverless для `/api/auth/*` | Vercel |
| `apps/api` | `tarot-ai-api-sevice` (опечатка, не менять) | Fastify BFF: Supabase + OpenAI + Lava | Render (Docker) |
| `apps/admin` | `tarot-admin` | react-admin, отдаётся на `/admin` из web-билда | вместе с web |
| `apps/bot` | `tarot-telegram-bot` | Telegram-бот (grammY) | Timeweb (Docker) |
| `apps/native` | — | git submodule, Expo iOS/Android, свой yarn. **Не трогать, если не просят** | EAS |
| `supabase/` | — | миграции + Edge Functions | GitHub Actions на push в main |

Схема прода: Vercel (web) → `/api/auth/*` обслуживает serverless на Vercel, остальные `/api/*` проксируются на Render (API) → Supabase + OpenAI. Сессия — HttpOnly cookie `tarot_session`.

## Запуск

```bash
pnpm install
cp apps/api/.env.example apps/api/.env    # placeholder-ключи → RAM-бэкенд + mock OpenAI, Supabase не нужен
cp apps/web/.env.example apps/web/.env
pnpm dev:ui      # API+web разом: mock-авторизация (demo), mock OpenAI, лимит раскладов 100000 — для обзора UI
pnpm dev:api     # :3002, /docs, /health
pnpm dev:web     # :8081, автологин demo при EXPO_PUBLIC_DEV_QUICK_LOGIN=1
pnpm --filter tarot-admin dev   # :5173/admin/
pnpm dev:bot     # нужен TELEGRAM_BOT_TOKEN
# С реальной БД: pnpm supabase:start && pnpm supabase:reset, ключи из `supabase status` → apps/api/.env
```

## Проверки

```bash
pnpm --filter web exec tsc --noEmit
pnpm --filter tarot-ai-api-sevice exec tsc --noEmit
pnpm --filter tarot-telegram-bot exec vitest run
pnpm build:web / pnpm build:api
```
`test`-скриптов в package.json нет, ESLint в web не настроен. После правок прогоняй `tsc` затронутого пакета.

## Правила

- Не читать тяжёлые и сгенерированные файлы: `**/dist`, lock-файлы, `apps/web/src/locales/*/card.json` (22 MB), `public/locales`. Для поиска по ним — `rg`/`jq`.
- `.env` не коммитить; новая переменная → в соответствующий `.env.example` (для прода ещё и в `DEPLOY.md`).
- `react`/`react-dom` закреплены на 19.0.0 через root `pnpm.overrides`.
- Коммиты: conventional-стиль на русском (`feat: ...`, `fix: ...`).
- Деплой и прод-окружения: [DEPLOY.md](DEPLOY.md), [docs/](docs/).
