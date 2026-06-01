# Supabase — Mindful Tarot

Backend data layer: **Postgres + Auth + RLS + Edge Functions**.

## Structure

```
supabase/
  config.toml              # local Supabase CLI config
  migrations/              # SQL schema, RLS, RPC
  functions/
    interpret/               # POST — AI spread interpretation
    motivation-mood/         # POST — mood & energy card
    motivation-habits/       # POST — habits card
    _shared/                 # auth, cors, openai helpers
```

## Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User profile (linked to `auth.users`) |
| `tarot_daily_usage` | Daily spread limit counter |
| `spreads` | Spread history (JSON payload) |
| `favorite_cards` | Favorite tarot cards |
| `user_settings` | Appearance / app settings (JSON) |

RPC (service role only):

- `consume_tarot_daily_slot_for_user(user_id, limit)`
- `get_tarot_daily_usage_for_user(user_id, limit)`

## Local setup

1. Install [Supabase CLI](https://supabase.com/docs/guides/cli)
2. From repo root:

```bash
supabase start
supabase db reset
```

3. Copy keys from `supabase status` into `apps/api/.env` (see `.env.example`)

4. Edge Functions secrets (local):

```bash
supabase secrets set OPENAI_API_KEY=sk-...
```

5. Serve functions locally:

```bash
supabase functions serve --env-file apps/api/.env
```

## Deploy (Supabase Cloud)

См. **[DEPLOY.md](../DEPLOY.md)** в корне репозитория.

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

### Auth URLs (Dashboard)

После деплоя Vercel укажите в **Authentication → URL Configuration**:

- **Site URL:** `https://your-app.vercel.app`
- **Redirect URLs:** `https://your-app.vercel.app/**`, `https://*.vercel.app/**`

Set secrets in Dashboard → Edge Functions → Secrets:

- `OPENAI_API_KEY`
- `TAROT_DAILY_INTERPRET_LIMIT` (optional, default 10)

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically in Edge Functions.

## Client integration

Web/native should use `@supabase/supabase-js` for:

- Auth (`signInWithPassword`, `signUp`, session)
- Direct CRUD on `spreads`, `favorite_cards`, `user_settings` via RLS

AI calls can go to:

- **Edge Functions**: `https://<project>.supabase.co/functions/v1/interpret`
- **Fastify BFF** (`apps/api`): existing `/api/*` routes (backward compatible during migration)

Both verify **Supabase access token** (Bearer or HttpOnly cookie `tarot_session` on web).
