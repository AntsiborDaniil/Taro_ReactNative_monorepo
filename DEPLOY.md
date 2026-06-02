# Деплой: Supabase + API (Render) + Web (Vercel)

Пошаговая инструкция для production.

**Краткий чеклист «что сделать вручную»:** [docs/DEPLOY_YOUR_STEPS.md](docs/DEPLOY_YOUR_STEPS.md)  
(фронт: `https://taro-react-native-monorepo.vercel.app`, Supabase ref: `urrbsxwlmsfedezwtglm`)

## Схема

```
Пользователь
    → https://your-app.vercel.app          (Expo static)
         ├─ /api/*  ──proxy──►  https://tarot-api.onrender.com  (Fastify BFF)
         └─ cookie tarot_session на домене Vercel

Supabase Cloud
    ├─ Postgres (profiles, spreads, favorites, settings, limits)
    ├─ Auth
    └─ Edge Functions (interpret, motivation-*) — опционально
```

Рекомендуется **same-origin**: фронт на Vercel проксирует `/api` на BFF — HttpOnly cookie работает без cross-origin.

---

## 1. Supabase

### 1.1 Создать проект

1. [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**
2. Сохраните **Project URL**, **anon key**, **service_role key**

### 1.2 Миграции (локально)

```bash
cd /path/to/taro_monorepo
supabase login
supabase link --project-ref <YOUR_PROJECT_REF>
supabase db push
```

Или через GitHub Actions (см. `.github/workflows/supabase-deploy.yml`):
- Secrets: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`

### 1.3 Edge Functions (опционально)

```bash
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set TAROT_DAILY_INTERPRET_LIMIT=10

supabase functions deploy interpret --no-verify-jwt
supabase functions deploy motivation-mood --no-verify-jwt
supabase functions deploy motivation-habits --no-verify-jwt
```

> Сейчас web использует BFF `/api/interpret`, не Edge Functions. Edge Functions можно включить позже.

### 1.4 Auth URLs (Dashboard)

**Authentication → URL Configuration:**

| Поле | Значение |
|------|----------|
| Site URL | `https://your-app.vercel.app` |
| Redirect URLs | `https://your-app.vercel.app/**`, `https://*.vercel.app/**` |

**Authentication → Providers → Email:** включить Email. **Google:** включить провайдер (см. [docs/SUPABASE_PRODUCTION_AUTH.md](docs/SUPABASE_PRODUCTION_AUTH.md)). В шаблоне письма — `{{ .Token }}` для 6-значного кода.

---

## 2. API (Fastify BFF) — Render.com

Vercel не запускает долгоживущий Node-сервер — API деплоим отдельно.

### 2.1 Render

1. [render.com](https://render.com) → **New → Web Service**
2. Подключить GitHub-репозиторий
3. **Root Directory:** `apps/api`
4. **Runtime:** Docker (используется `Dockerfile.prod`)
5. **Health Check Path:** `/health`

### 2.2 Environment Variables (Render)

| Variable | Пример |
|----------|--------|
| `NODE_ENV` | `production` |
| `PORT` | `8080` |
| `SUPABASE_URL` | `https://xxxx.supabase.co` |
| `SUPABASE_ANON_KEY` | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` (секрет!) |
| `OPENAI_API_KEY` | `sk-...` |
| `CORS_ORIGIN` | `https://taro-react-native-monorepo-x59s.vercel.app` |
| `WEB_APP_URL` | `https://taro-react-native-monorepo-x59s.vercel.app` |
| `API_PUBLIC_URL` | `https://your-service.onrender.com` (URL Render после деплоя) |
| `ALLOW_VERCEL_PREVIEW` | `1` |
| `TAROT_DAILY_INTERPRET_LIMIT` | `10` |

После деплоя скопируйте URL сервиса, например: `https://tarot-api.onrender.com`

Проверка: `curl https://tarot-api.onrender.com/health` → `{"ok":true,"supabase":true}`

Альтернатива: `apps/api/render.yaml` (Blueprint).

---

## 3. Web — Vercel

### 3.1 Подключить репозиторий

1. [vercel.com](https://vercel.com) → **Add New Project**
2. Import Git repo
3. **Root Directory:** `apps/web`

### 3.2 Build settings

| Setting | Value |
|---------|--------|
| **Framework Preset** | Other |
| **Install Command** | `cd ../.. && pnpm install` |
| **Build Command** | `cd ../.. && pnpm --filter web build` |
| **Output Directory** | `dist` |

### 3.3 Environment Variables (Vercel)

| Variable | Значение |
|----------|----------|
| `TAROT_API_PROXY_URL` | URL Render из шага 2, **без** слэша в конце |
| `EXPO_PUBLIC_TAROT_API_BASE_URL` | `same-origin` (или оставить пустым) |

После деплоя: `pnpm deploy:check-health` или `RENDER_URL=https://...onrender.com pnpm deploy:check-health`

`vercel.json` в репозитории уже содержит proxy `/api` → Render. Скрипт `generate-vercel-config.mjs` при билде перезаписывает его (env `TAROT_API_PROXY_URL` или дефолтный Render URL).

### 3.4 Проверка после деплоя

1. Открыть `https://your-app.vercel.app`
2. Настройки → Регистрация / Вход
3. Сделать расклад → история и лимит на сервере
4. DevTools → Network: запросы на `https://your-app.vercel.app/api/...` (не на render.com напрямую)
5. Application → Cookies: `tarot_session` на домене `.vercel.app`

---

## 4. Чеклист перед продом

- [ ] `supabase db push` без ошибок
- [ ] Auth Site URL = Vercel URL
- [ ] Render `/health` OK
- [ ] `CORS_ORIGIN` содержит production Vercel URL
- [ ] `TAROT_API_PROXY_URL` в Vercel указывает на Render API
- [ ] `EXPO_PUBLIC_TAROT_API_BASE_URL=same-origin` на Vercel
- [ ] Sign up / sign in / spread / favorites работают

---

## 5. Кастомный домен (опционально)

1. Vercel → Domains → `app.yourdomain.com`
2. Добавить этот URL в Supabase Auth Redirect URLs
3. Обновить `CORS_ORIGIN` на API: `https://app.yourdomain.com`
4. Пересобрать Vercel (proxy URL Render не меняется)

---

## 6. Локальная разработка

```bash
# Терминал 1 — Supabase
pnpm supabase:start
pnpm supabase:reset

# apps/api/.env — ключи из `supabase status`
pnpm dev:api

# apps/web/.env
EXPO_PUBLIC_TAROT_API_BASE_URL=http://127.0.0.1:3002

pnpm dev:web
```

---

## 7. Troubleshooting

| Проблема | Решение |
|---------|---------|
| 401 на всех `/api/*` | Нет cookie: проверьте same-origin (`EXPO_PUBLIC_TAROT_API_BASE_URL=same-origin`) и proxy |
| CORS error | Добавьте Vercel URL в `CORS_ORIGIN` на API |
| Cookie не ставится | Сайт только по HTTPS; `secure: true` в production |
| `/api` 404 на Vercel | Не задан `TAROT_API_PROXY_URL` или не пересобран проект |
| Render cold start | Free tier засыпает — первый запрос медленный |

---

## 8. Файлы в репозитории

| Путь | Назначение |
|------|------------|
| `supabase/migrations/` | Схема БД |
| `apps/api/` | Fastify BFF |
| `apps/api/render.yaml` | Blueprint Render |
| `apps/web/scripts/generate-vercel-config.mjs` | Proxy для Vercel |
| `apps/web/vercel.json` | Proxy `/api` + SPA fallback |
| `.github/workflows/supabase-deploy.yml` | CI для Supabase |
