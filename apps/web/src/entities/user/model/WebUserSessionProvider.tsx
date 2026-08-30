import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SubscriptionType } from 'shared/api';
import type { AuthSessionUser, TarotDailyQuota } from './types';
import { UserContext } from './UserContext';
import { DataProvider } from 'shared/DataProvider';
import { handleWebOAuthReturn } from 'shared/lib/handleWebOAuthReturn';
import { fetchAuthMeSession } from 'shared/lib/web/fetchAuthMeSession';
import { tryAuthenticateTelegramMiniApp } from 'shared/lib/web/telegramWebApp';
import { tryDevQuickLogin } from 'shared/lib/web/tryDevQuickLogin';
import {
  TAROT_AUTH_CHANGED_EVENT,
  type TarotAuthChangedDetail,
} from 'shared/lib/tarotAuthEvents';
import { migrateLocalDataToCloud } from 'shared/lib/cloudMigration/migrateLocalToCloud';

export function WebUserSessionProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation('settings');
  const [authUser, setAuthUser] = useState<AuthSessionUser | null>(null);
  const [tarotDaily, setTarotDaily] = useState<TarotDailyQuota | null>(null);
  const [authSessionLoading, setAuthSessionLoading] = useState(true);
  const authUserRef = useRef<AuthSessionUser | null>(null);
  const tarotDailyRef = useRef<TarotDailyQuota | null>(null);
  const devQuickLoginAttemptedRef = useRef(false);

  useEffect(() => {
    authUserRef.current = authUser;
    tarotDailyRef.current = tarotDaily;
  }, [authUser, tarotDaily]);

  const applySession = useCallback((user: AuthSessionUser | null, daily: TarotDailyQuota | null) => {
    setAuthUser(user);
    setTarotDaily(daily);
    if (user?.id) {
      void migrateLocalDataToCloud(user.id);
    }
  }, []);

  const loadMe = useCallback(async (fallbackUser?: AuthSessionUser) => {
    if (Platform.OS !== 'web') {
      setAuthSessionLoading(false);
      return;
    }

    try {
      await tryAuthenticateTelegramMiniApp();

      const previousSession =
        authUserRef.current != null
          ? {
              user: authUserRef.current,
              tarotDaily: tarotDailyRef.current,
            }
          : fallbackUser
            ? { user: fallbackUser, tarotDaily: null }
            : null;

      let session = await fetchAuthMeSession({ previousSession });

      if (!session?.user && !devQuickLoginAttemptedRef.current) {
        devQuickLoginAttemptedRef.current = true;
        const quick = await tryDevQuickLogin();
        if (quick.ok) {
          if (quick.user) {
            applySession(quick.user, null);
            // Refresh quota in background; UI already unlocked
            void fetchAuthMeSession({ retryUnauthorized: false }).then(
              (refreshed) => {
                if (refreshed?.user) {
                  applySession(refreshed.user, refreshed.tarotDaily ?? null);
                }
              }
            );
            return;
          }
          session = await fetchAuthMeSession({ retryUnauthorized: false });
        }
      }

      if (session?.user) {
        applySession(session.user, session.tarotDaily ?? null);
        return;
      }

      if (fallbackUser) {
        applySession(fallbackUser, null);
        return;
      }

      applySession(null, null);
    } catch {
      if (fallbackUser) {
        applySession(fallbackUser, null);
      } else {
        applySession(null, null);
      }
    } finally {
      setAuthSessionLoading(false);
    }
  }, [applySession]);

  useEffect(() => {
    void loadMe();
  }, [loadMe]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      return;
    }

    const refreshSession = () => {
      void loadMe();
    };

    window.addEventListener('focus', refreshSession);
    window.addEventListener('pageshow', refreshSession);

    return () => {
      window.removeEventListener('focus', refreshSession);
      window.removeEventListener('pageshow', refreshSession);
    };
  }, [loadMe]);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }

    const search = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : ''
    );
    if (!search.get('auth')) {
      return;
    }

    void handleWebOAuthReturn({
      loadSession: loadMe,
      tSuccess: t('auth.oauth.success'),
      tError: t('auth.oauth.error'),
    });
  }, [loadMe, t]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      return;
    }
    const onAuthChanged = (event: Event) => {
      const detail = (event as CustomEvent<TarotAuthChangedDetail>).detail;
      setAuthSessionLoading(true);
      void loadMe(detail?.user);
    };
    window.addEventListener(TAROT_AUTH_CHANGED_EVENT, onAuthChanged);
    return () => {
      window.removeEventListener(TAROT_AUTH_CHANGED_EVENT, onAuthChanged);
    };
  }, [loadMe]);

  const refreshAuthSession = useCallback(async () => {
    setAuthSessionLoading(true);
    await loadMe();
  }, [loadMe]);

  const value = useMemo(
    () => ({
      customerInfo: null,
      subscriptionType: SubscriptionType.Freemium,
      setSubscriptionType: () => {},
      isPractitioner: false,
      isAuthenticated: Platform.OS === 'web' ? !!authUser : false,
      authUser,
      tarotDaily,
      authSessionLoading,
      refreshAuthSession,
      setTarotDaily,
    }),
    [authUser, tarotDaily, authSessionLoading, refreshAuthSession]
  );

  return (
    <DataProvider Context={UserContext} value={value}>
      {children}
    </DataProvider>
  );
}
