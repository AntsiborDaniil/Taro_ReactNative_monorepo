---
paths:
  - "apps/api/**"
---

# apps/api — Fastify BFF

Fastify 5 + TS (CommonJS, `ts-node` в dev), Supabase JS (service role), OpenAI SDK. Порт 3002, Swagger `/docs`, health `/health`. Имя пакета `tarot-ai-api-sevice` (опечатка намеренно сохранена).

## Слои

- `src/index.ts` — плагины (cookie, cors, swagger) и регистрация роутов, все с `{ prefix: '/api' }`. Новый роут-файл регистрировать здесь.
- `src/routes/<name>.ts` — `export const xxxRoute = async (fastify: FastifyInstance, _opts) => { ... }`. В хендлере:
  1. `const user = await resolveAuthedUser(request)` (`lib/authRequest.ts`), нет юзера → `reply.status(401).send({ message: 'Unauthorized' })`;
  2. body валидируется через Fastify JSON schema (`schema: { body: {...} }`), тип через generic `fastify.post<{ Body: ... }>`;
  3. логика в сервисе; `catch` → `request.log.error(error)` + `reply.status(500).send({ message: '...' })`.
  Ошибки всегда `{ message, code? }`: web-клиент (`cloudFetch`) читает именно эти поля.
- Админ-эндпоинты: `requireAdmin(request, reply)` / `assertSupervisor` (`lib/requireAdmin.ts`), роли `admin` | `supervisor`. Списки отдаются в формате react-admin (`ra-data-simple-rest`: заголовки `Content-Range` / `X-Total-Count`, query `range`/`sort`/`filter`).
- `src/services/<name>Service.ts` — бизнес-логика. **Каждая функция сначала проверяет `if (useMemoryBackend()) return memory.memoryXxx(...)`**, потом идёт в Supabase через `getSupabaseAdmin()` (`lib/supabase.ts`); `if (error) throw error`. Новая функция сервиса → парная `memoryXxx` в `src/dev/memoryBackend.ts`, иначе локальный dev без Supabase сломается.
- AI: `spreadInterpretationService`, `moodAndEnergyMotivationService`, `habitsMotivationService`; в dev без ключа — `src/dev/mockOpenAi.ts` (`useMockOpenAi()`). Ошибки OpenAI маппятся в `lib/openaiErrors.ts`.
- Лимиты: `tarotDailyUsageService` (RPC `consume_tarot_daily_slot_for_user` и др.), спред-кредиты и Lava — `lavaPaymentsService`, `lavaClient`, роут `lavaPayments.ts` (checkout + webhook по `LAVA_WEBHOOK_SECRET`).
- Auth: `authService` (Supabase Auth, email OTP, Google OAuth PKCE `lib/supabaseOAuth.ts` + `oauthPkceStorage.ts`, Telegram initData `lib/telegramWebApp.ts`). Cookie — `constants/authCookie.ts` (`tarot_session`).
- Саппорт-тикеты из бота: `routes/internalSupport.ts`. Acquisition (метки источников трафика из Telegram): `acquisitionService`, `lib/acquisitionSources.ts`.
- Env: `lib/env.ts`, CORS — `lib/cors.ts` (`CORS_ORIGIN` через запятую, `ALLOW_VERCEL_PREVIEW`), URL'ы — `lib/appUrls.ts`. Dev-флаги — `lib/devMode.ts`.

## Важно

- Эндпоинты `/api/auth/*` дублируются serverless-функциями в `apps/web/api/auth/*` (на проде их обслуживает Vercel). Меняешь контракт auth — проверь обе реализации.
- Типы БД: `pnpm --filter tarot-ai-api-sevice supabase:types` (нужен локальный Supabase).
- Проверка: `pnpm --filter tarot-ai-api-sevice exec tsc --noEmit`. Vitest в devDeps есть, тестов пока нет; `lib/adminAuth.selftest.ts` — самопроверка без фреймворка.
- В `apps/api` лежит `yarn.lock` для деплоя на Render, локально используй pnpm из корня.
