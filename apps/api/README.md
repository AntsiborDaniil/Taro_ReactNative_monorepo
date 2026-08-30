# Tarot API (Supabase-backed)

Fastify BFF for Mindful Tarot. Uses **Supabase Auth + Postgres** instead of in-memory storage.

## Requirements

- Node 22+
- Running Supabase (local or cloud) — see [`../../supabase/README.md`](../../supabase/README.md)

## Environment

Copy `.env.example` → `.env` and fill:

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Project URL |
| `SUPABASE_ANON_KEY` | Public anon key (auth sign-in/up) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key (never expose to client) |
| `OPENAI_API_KEY` | OpenAI API key |
| `CORS_ORIGIN` | Comma-separated web origins |
| `PORT` | Default `3002` |

## Local dev (memory + mocks)

С placeholder `SUPABASE_*` (как в `.env.example`) включается **RAM-бэкенд** + **mock OpenAI** — полный UI без Docker/Supabase/реального GPT.

| Что | Как |
|-----|-----|
| Auth / spreads / favorites | memory backend |
| `/api/interpret`, mood, habits | mock текст + ~1.8s delay (loader UI) |
| Быстрый вход | `POST /api/auth/dev/quick-login` → `demo@tarot.local` / `demo` |
| Web авто-логин | `EXPO_PUBLIC_DEV_QUICK_LOGIN=1` в `apps/web/.env` |
| Live OpenAI при memory | `USE_MOCK_OPENAI=0` + реальный `OPENAI_API_KEY` |
| Telegram в memory | работает; без токена — `TELEGRAM_DEV_BYPASS=1` |

В терминале API:

| Лог | Значение |
|-----|----------|
| `[api] DEV memory backend` | данные в RAM |
| `[api] DEV mock OpenAI` | interpret без ключа |
| `[api] Dev quick login` | endpoint доступен |
| `[auth email] SIMULATED …` | письмо с кодом *бы* ушло |
| `[auth google] DEV mock sign-in` | Google без OAuth |

- Регистрация по умолчанию **сразу логинит** (без экрана кода).
- `DEV_AUTH_REQUIRE_EMAIL_VERIFY=1` — двухшаговый OTP (код в логе и в `devVerificationCode`).

`GET /health` → `{ memoryBackend, mockOpenAi, devAuthRequireEmailVerify }`.

Walkthrough: `pnpm dev:api` + `pnpm dev:web` → открыть app → уже demo-сессия → любой расклад → AI → история.
## Scripts

```bash
yarn install
yarn dev          # hot reload
yarn build && yarn start
```

## API routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | — | Health check |
| POST | `/api/auth/signup` | — | Register (Supabase Auth) |
| POST | `/api/auth/signin` | — | Login |
| POST | `/api/auth/signout` | — | Clear session cookie |
| GET | `/api/auth/me` | ✓ | Current user + daily quota |
| PATCH | `/api/auth/profile` | ✓ | Update name |
| PATCH | `/api/auth/password` | ✓ | Change password |
| GET | `/api/spreads` | ✓ | List spread history |
| GET | `/api/spreads/:id` | ✓ | Get spread |
| POST | `/api/spreads` | ✓ | Save spread |
| PATCH | `/api/spreads/:id` | ✓ | Update spread |
| POST | `/api/interpret` | ✓ | AI interpretation (quota via `/tarot/daily/consume`) |
| POST | `/api/tarot/daily/consume` | ✓ | Consume daily slot |
| GET | `/api/favorites` | ✓ | List favorite card ids |
| POST | `/api/favorites` | ✓ | Add favorite |
| DELETE | `/api/favorites/:cardId` | ✓ | Remove favorite |
| GET | `/api/settings` | ✓ | User settings JSON |
| PUT | `/api/settings` | ✓ | Replace settings |
| PATCH | `/api/settings` | ✓ | Merge settings patch |
| POST | `/api/motivation/moodAndEnergy` | ✓ | Mood AI |
| POST | `/api/motivation/habits` | ✓ | Habits AI |

Web clients: send `X-Web-Cookie-Auth: 1` on sign-in/up; session stored in HttpOnly cookie `tarot_session` (Supabase access token).

Native clients: use `Authorization: Bearer <access_token>` from Supabase session JSON.

## Migration from v1

- Removed in-memory users and custom JWT (`bcryptjs`, `jsonwebtoken`)
- Daily limits persist in `tarot_daily_usage`
- Spread history available via `/api/spreads` (client can migrate from AsyncStorage)

## Deploy

Production: **[DEPLOY.md](../../DEPLOY.md)** — Supabase + Render (API) + Vercel (web).

**Render (Node):** Root Directory `apps/api`. Build Command: `npm install && npm run build`. Start: `npm start`.  
(TypeScript pinned to `5.8.3`; Yarn 1 on Render does not use the repo’s Yarn Berry `yarn.lock`.)

**Render (Docker):** Runtime Docker, `Dockerfile.prod` — preferred; no custom build command.

Quick health check after API deploy: `GET /health`
