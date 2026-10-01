/**
 * Аналог apps/web/src/shared/lib/web/tryDevQuickLogin.ts (EXPO_PUBLIC_DEV_QUICK_LOGIN)
 * для Vite: гейт через import.meta.env.VITE_DEV_QUICK_LOGIN. Same-origin cookie-сессия
 * (proxy /api -> :3002 в dev), поэтому достаточно POST с credentials:'include' —
 * Bearer-токен (как в RN) не нужен.
 */
export function isDevQuickLoginEnabled(): boolean {
  const raw = (import.meta.env.VITE_DEV_QUICK_LOGIN as string | undefined)?.trim().toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'yes';
}

/** POST /api/auth/dev/quick-login — должен слать JSON body `{}` (Fastify отвергает пустой application/json). */
export async function tryDevQuickLogin(): Promise<boolean> {
  if (!isDevQuickLoginEnabled()) {
    return false;
  }

  try {
    const response = await fetch('/api/auth/dev/quick-login', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-Web-Cookie-Auth': '1',
      },
      body: '{}',
    });

    return response.ok;
  } catch {
    return false;
  }
}
