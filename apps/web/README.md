# Mindful Tarot — Web (Expo)

## Development

```bash
cp .env.example .env
# EXPO_PUBLIC_TAROT_API_BASE_URL=http://127.0.0.1:3002

pnpm dev
```

From monorepo root: `pnpm dev:web`

## Production (Vercel)

See **[DEPLOY.md](../../DEPLOY.md)**.

**Vercel project settings:**

| Setting | Value |
|---------|--------|
| Root Directory | `apps/web` |
| Install | `cd ../.. && pnpm install` |
| Build | `cd ../.. && pnpm --filter web build` |
| Output | `dist` |

**Environment:**

- `TAROT_API_PROXY_URL` — URL deployed API (Render/Railway)
- `EXPO_PUBLIC_TAROT_API_BASE_URL` — `same-origin` or empty
