# Supabase Auth — production (обязательно в Dashboard)

Проект: `urrbsxwlmsfedezwtglm`  
Сайт: `https://taro-react-native-monorepo.vercel.app`

Код API уже настроен на OTP и Google OAuth; **провайдеры включаются только в Supabase Dashboard**.

---

## 1. Google — `Unsupported provider: provider is not enabled`

1. [Authentication → Sign In / Providers](https://supabase.com/dashboard/project/urrbsxwlmsfedezwtglm/auth/providers) (или **Third-party** / **Auth Providers**).
2. **Google** → **Enable**.
3. Вставь **Client ID** и **Client Secret** из [Google Cloud Console](https://console.cloud.google.com/) (OAuth Web client).
4. **Authorized redirect URI** в Google (не Vercel):

   `https://urrbsxwlmsfedezwtglm.supabase.co/auth/v1/callback`

5. **Save**.

Без включённого Google в Supabase редирект на `…/auth/v1/authorize?provider=google` всегда вернёт `validation_failed`.

---

## 2. URL Configuration

[Authentication → URL Configuration](https://supabase.com/dashboard/project/urrbsxwlmsfedezwtglm/auth/url-configuration)

| Поле | Значение |
|------|----------|
| **Site URL** | `https://taro-react-native-monorepo.vercel.app` |
| **Redirect URLs** | `https://taro-react-native-monorepo.vercel.app/**` |
| | `https://taro-react-native-monorepo.vercel.app/api/auth/oauth/callback` |
| | `https://*.vercel.app/**` |

---

## 3. Email — 6-значный код (не ссылка «Confirm email»)

API шлёт OTP через `signInWithOtp`. В письме должен быть **код**, не только кнопка с ссылкой.

1. [Authentication → Emails → Templates](https://supabase.com/dashboard/project/urrbsxwlmsfedezwtglm/auth/templates) (или **Email** → **Templates**).
2. Шаблон **Confirm signup** / **Magic Link** — в теле письма добавь код:

   ```html
   <p>Your verification code: <strong>{{ .Token }}</strong></p>
   ```

   (можно оставить и ссылку, но для приложения нужен `{{ .Token }}`.)

3. В настройках Email provider включи **OTP** / **Email OTP**, если есть отдельный переключатель (зависит от версии Dashboard).

4. **Confirm email** может оставаться включённым — главное, чтобы в шаблоне был `{{ .Token }}`.

После смены шаблона зарегистрируйся снова — должно прийти 6 цифр.

---

## 4. Render env (после смены домена Vercel)

| Variable | Value |
|----------|--------|
| `WEB_APP_URL` | `https://taro-react-native-monorepo.vercel.app` |
| `API_PUBLIC_URL` | `https://taro-react-native-monorepo.vercel.app` |
| `CORS_ORIGIN` | `https://taro-react-native-monorepo.vercel.app` |

`API_PUBLIC_URL` = Vercel (same-origin proxy), не `onrender.com`.

---

## 5. Vercel env

| Variable | Value |
|----------|--------|
| `EXPO_PUBLIC_TAROT_API_BASE_URL` | `same-origin` |
| `TAROT_API_PROXY_URL` | `https://taro-reactnative-monorepo.onrender.com` (твой Render URL) |

Redeploy после изменений.
