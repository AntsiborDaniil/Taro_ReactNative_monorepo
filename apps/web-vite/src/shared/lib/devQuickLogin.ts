import { store } from '@app/store';
import { userApi } from '@entities/user/api';

/**
 * Аналог apps/web/src/shared/lib/web/tryDevQuickLogin.ts (EXPO_PUBLIC_DEV_QUICK_LOGIN)
 * для Vite: гейт через import.meta.env.VITE_DEV_QUICK_LOGIN. Запрос идёт тем же
 * RTK Query, что и прод (cookie-сессия, заголовок X-Web-Cookie-Auth).
 */
export function isDevQuickLoginEnabled(): boolean {
  const raw = (import.meta.env.VITE_DEV_QUICK_LOGIN as string | undefined)?.trim().toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'yes';
}

/** POST /api/auth/dev/quick-login — тело `{}` задаёт эндпоинт devQuickLogin. */
export async function tryDevQuickLogin(): Promise<boolean> {
  if (!isDevQuickLoginEnabled()) {
    return false;
  }

  try {
    const result = await store.dispatch(userApi.endpoints.devQuickLogin.initiate());
    return userApi.endpoints.devQuickLogin.matchFulfilled(result);
  } catch {
    return false;
  }
}
