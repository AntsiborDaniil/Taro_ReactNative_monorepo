---
name: api-endpoint
description: Добавить или изменить эндпоинт в apps/api (Fastify) end-to-end — роут, сервис с memory-бэкендом, при необходимости миграция, и клиентский вызов в apps/web. Использовать, когда нужен новый /api/* метод или новые данные с бэка.
---

# Новый эндпоинт /api/*

1. **Сервис** `apps/api/src/services/<name>Service.ts`:
   ```ts
   export async function doThing(userId: string, input: X): Promise<Y> {
     if (useMemoryBackend()) {
       return memory.memoryDoThing(userId, input);
     }
     const admin = getSupabaseAdmin();
     const { data, error } = await admin.from('<table>')...;
     if (error) throw error;
     return map(data);
   }
   ```
2. **Memory-бэкенд**: парная `memoryDoThing` в `apps/api/src/dev/memoryBackend.ts` (in-memory Map/массив, те же типы). Без неё локальный dev сломается.
3. **Роут** `apps/api/src/routes/<name>.ts` (или существующий файл): `resolveAuthedUser` → 401; JSON schema для body/params; `try/catch` → `request.log.error` + `{ message }` со статусом. Новый файл регистрировать в `src/index.ts` с `{ prefix: '/api' }`. Для админки — `requireAdmin` и формат react-admin.
4. **БД** (если нужна новая таблица/колонка) — skill `db-migration`, потом `supabase:types`.
5. **Web-клиент**: функция в `apps/web/src/shared/api/cloud/<name>Api.ts` на `cloudFetch<T>('/api/...', { method, body: JSON.stringify(...) })`, экспорт через `shared/api/cloud/index.ts`; результат обрабатывать по `ok`, для гостя (не залогинен) — локальный fallback, если фича работает без аккаунта.
6. Если эндпоинт в `/api/auth/*` — продублировать в `apps/web/api/auth/` (Vercel serverless обслуживает auth на проде).
7. Новые env → `apps/api/.env.example` (+ таблица в `DEPLOY.md`, если нужно на Render).
8. Проверка: `pnpm --filter tarot-ai-api-sevice exec tsc --noEmit` и `pnpm --filter web exec tsc --noEmit`; ручной прогон — `pnpm dev:api`, `curl localhost:3002/api/...` (dev-логин: `POST /api/auth/dev/quick-login`).
