# Что нужно сделать тебе (деплой бэка + связка с Vercel)

В репозитории уже подготовлены `render.yaml`, примеры env и чеклист.  
**Render, Vercel и Supabase Dashboard** — только у тебя (секреты и кнопки «Create»).

Твой фронт: **https://taro-react-native-monorepo.vercel.app**  
Supabase project ref: **urrbsxwlmsfedezwtglm**

---

## Шаг 1. Supabase — таблицы в облаке (5–10 мин)

1. [Dashboard](https://supabase.com/dashboard/project/urrbsxwlmsfedezwtglm) → **Table Editor**  
   - Если **нет** таблиц `profiles`, `spreads`, … → миграции не применены.

2. Применить миграции (один способ):
   - **SQL Editor** → New query → вставь и выполни по очереди:
     - `supabase/migrations/20250525120000_initial_schema.sql`
     - `supabase/migrations/20250525120001_rls_and_rpc.sql`
   - **Или** в терминале (pooler, если `db push` таймаутит):
     ```bash
     supabase db push --db-url "postgresql://postgres.urrbsxwlmsfedezwtglm:[ПАРОЛЬ_БД]@[HOST_ИЗ_DASHBOARD]:6543/postgres"
     ```
     Host возьми в **Project Settings → Database → Connection string** (Transaction pooler).

3. **Authentication → URL Configuration**
   - Site URL: `https://taro-react-native-monorepo.vercel.app`
   - Redirect URLs: `https://taro-react-native-monorepo.vercel.app/**`, `https://*.vercel.app/**`

4. **Project Settings → API** — скопируй (понадобятся на шаге 2):
   - Project URL  
   - `anon` public  
   - `service_role` secret  

---

## Шаг 2. Render — задеплоить API (10–15 мин)

1. [render.com](https://render.com) → **New +** → **Blueprint** (или Web Service).
2. Репозиторий **taro_monorepo**, путь к blueprint: **`apps/api/render.yaml`**  
   (или вручную: Root Directory `apps/api`, Docker, `Dockerfile.prod`, health `/health`).
3. При создании сервиса **заполни секреты** (Render спросит `sync: false`):

| Переменная | Откуда взять |
|------------|----------------|
| `SUPABASE_URL` | `https://urrbsxwlmsfedezwtglm.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → API |
| `OPENAI_API_KEY` | OpenAI |
| `CORS_ORIGIN` | уже в yaml: твой Vercel URL |
| `WEB_APP_URL` | уже в yaml |
| `API_PUBLIC_URL` | после деплоя: URL сервиса Render (шаг 4) |

4. Дождись статуса **Live**, скопируй URL вида `https://tarot-api-xxxx.onrender.com`.

5. Если `API_PUBLIC_URL` не подставился автоматически — в **Environment** Render вручную:
   `API_PUBLIC_URL=https://твой-сервис.onrender.com` (без `/` в конце) → **Save** → **Manual Deploy**.

**Проверка (у себя в терминале):**

```bash
curl https://ТВОЙ-SERVICE.onrender.com/health
```

Нужно: `"ok":true,"supabase":true,"memoryBackend":false`

---

## Шаг 3. Vercel — proxy на API (3 мин)

1. [Vercel](https://vercel.com) → проект **taro-react-native-monorepo** → **Settings → Environment Variables**
2. Для **Production** (и Preview по желанию):

| Name | Value |
|------|--------|
| `TAROT_API_PROXY_URL` | `https://ТВОЙ-SERVICE.onrender.com` (из шага 2, **без** `/`) |
| `EXPO_PUBLIC_TAROT_API_BASE_URL` | `same-origin` |

3. **Deployments** → последний деплой → **⋯ → Redeploy** (обязательно пересборка).

**Проверка:**

```bash
curl https://taro-react-native-monorepo.vercel.app/health
```

Должен быть **JSON** `{"ok":true,...}`, не HTML.

---

## Шаг 4. Проверка в браузере

1. Открой https://taro-react-native-monorepo.vercel.app  
2. Настройки → регистрация / вход  
3. DevTools → Network: запросы на `...vercel.app/api/...`  
4. Cookie `tarot_session` на домене vercel.app  

---

## Если что-то не так

| Симптом | Действие |
|---------|----------|
| `/health` на Vercel = HTML | Нет `TAROT_API_PROXY_URL` при билде → шаг 3, Redeploy |
| Render health `memoryBackend: true` | Неверные `SUPABASE_*` на Render |
| 401 на `/api/*` | `EXPO_PUBLIC_TAROT_API_BASE_URL=same-origin` + Redeploy |
| Render 502 / долго | Free tier просыпается — подожди 30–60 с |

---

## Что уже сделано в репозитории (тебе не нужно)

- `apps/api/render.yaml` — шаблон Render с CORS/WEB_APP_URL  
- `apps/api/.env.production.example` — список переменных для Render  
- `supabase/config.toml` — `major_version = 17`  
- `DEPLOY.md` — полная документация  

После шагов 1–3 напиши URL Render — можно проверить связку ещё раз.
