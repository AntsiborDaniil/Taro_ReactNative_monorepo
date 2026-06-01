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

## Local dev (memory backend)

Без реальных `SUPABASE_*` включается RAM-режим. В терминале API:

| Лог | Значение |
|-----|----------|
| `[auth email] SIMULATED …` | Письмо с кодом *бы* ушло (в dev не отправляется) |
| `[auth] Registration complete` | Регистрация завершена, сессия выдана |
| `[auth google] DEV mock sign-in` | Вход через Google без OAuth |
| `[auth http] POST /api/auth/...` | Запрос auth (в dev по умолчанию) |

- Регистрация по умолчанию **сразу логинит** (без экрана кода).
- `DEV_AUTH_REQUIRE_EMAIL_VERIFY=1` — двухшаговый OTP (код в логе и в `devVerificationCode`).
- Google: `GET /api/auth/oauth/google` → mock callback → cookie.

`GET /health` → `{ memoryBackend, devAuthRequireEmailVerify }`.

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

Quick health check after API deploy: `GET /health`
