import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@shared/ui';
import { userApi } from '@entities/user';
import { useAppDispatch } from '@shared/lib/store';

export type OAuthReturnResult = 'success' | 'error' | null;

/**
 * Перенос apps/web/src/shared/lib/handleWebOAuthReturn.ts на react-router:
 * читает ?auth= из URL после редиректа с /api/auth/oauth/google (см.
 * apps/api/src/routes/auth.ts redirectToAppWithAuth), чистит query-строку и
 * инвалидирует кэш authMe (вместо TAROT_AUTH_CHANGED_EVENT — RTK Query тег
 * 'User' сам перезапустит useAuthMeQuery в AppShell).
 */
export function useHandleWebOAuthReturn(): void {
  const { t } = useTranslation();
  const toast = useToast();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const search = new URLSearchParams(window.location.search);
    const authStatus = search.get('auth');
    if (!authStatus) return;

    const authMessage = search.get('authMessage');
    search.delete('auth');
    search.delete('authMessage');
    const query = search.toString();
    const cleaned = `${window.location.pathname}${query ? `?${query}` : ''}`;
    window.history.replaceState({}, '', cleaned);

    if (authStatus === 'success') {
      dispatch(userApi.util.invalidateTags(['User', 'Settings', 'Favorites', 'Spreads']));
      toast.success(t('settings:auth.oauth.success'));
      return;
    }

    toast.error(authMessage || t('settings:auth.oauth.error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/** Строит ссылку на старт Google OAuth (см. apps/api/src/routes/auth.ts /auth/oauth/google). */
export function buildGoogleOAuthUrl(next: string): string {
  return `/api/auth/oauth/google?next=${encodeURIComponent(next)}`;
}
