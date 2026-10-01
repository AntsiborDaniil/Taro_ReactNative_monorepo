---
paths:
  - "apps/admin/**"
---

# apps/admin — админка (react-admin 5 + MUI 6, Vite)

- `base: '/admin/'`, dev: `pnpm --filter tarot-admin dev` → http://localhost:5173/admin/ (API из `VITE_API_BASE`, пусто = same-origin).
- `src/App.tsx` — `<Admin>` и ресурсы; `src/resources/{users,spreads,payments,tickets}.tsx` — List/Show/Edit ресурсов; `dataProvider.ts` — `ra-data-simple-rest` поверх `/api/admin/*` с cookie; `auth.ts` + `LoginPage.tsx` — вход через API, доступ только ролям `admin`/`supervisor`; `telegramBlock.ts` — админку нельзя открыть внутри Telegram Mini App.
- `inflection` подменён шимом (`src/shims/inflection.ts`, алиас в `vite.config.ts`) — не удалять.
- Серверная часть — `apps/api/src/routes/admin.ts` + `services/adminService.ts`. Новый ресурс = роут в API (формат react-admin) + файл в `resources/` + регистрация в `App.tsx`.
- На проде собирается внутри `pnpm build:web` и копируется в `apps/web/dist/admin` (`scripts/copy-admin-dist.mjs`).
