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
  const [spreadCredits, setSpreadCredits] = useState(0);
  const [authSessionLoading, setAuthSessionLoading] = useState(true);
  const authUserRef = useRef<AuthSessionUser | null>(null);
  const tarotDailyRef = useRef<TarotDailyQuota | null>(null);
  const spreadCreditsRef = useRef(0);
  const devQuickLoginAttemptedRef = useRef(false);

  useEffect(() => {
    authUserRef.current = authUser;
    tarotDailyRef.current = tarotDaily;
    spreadCreditsRef.current = spreadCredits;
  }, [authUser, tarotDaily, spreadCredits]);

  const applySession = useCallback(
    (
      user: AuthSessionUser | null,
      daily: TarotDailyQuota | null,
      credits?: number | null
    ) => {
      setAuthUser(user);
      setTarotDaily(daily);
      if (typeof credits === 'number' && Number.isFinite(credits)) {
        setSpreadCredits(Math.max(0, Math.floor(credits)));
      } else if (!user) {
        setSpreadCredits(0);
      }
      if (user?.id) {
        void migrateLocalDataToCloud(user.id);
      }
    },
    []
  );

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
              spreadCredits: spreadCreditsRef.current,
            }
          : fallbackUser
            ? { user: fallbackUser, tarotDaily: null, spreadCredits: 0 }
            : null;

      let session = await fetchAuthMeSession({ previousSession });

      if (!session?.user && !devQuickLoginAttemptedRef.current) {
        devQuickLoginAttemptedRef.current = true;
        const quick = await tryDevQuickLogin();
        if (quick.ok) {
          if (quick.user) {
            applySession(quick.user, null, 0);
            void fetchAuthMeSession({ retryUnauthorized: false }).then(
              (refreshed) => {
                if (refreshed?.user) {
                  applySession(
                    refreshed.user,
                    refreshed.tarotDaily ?? null,
                    refreshed.spreadCredits ?? 0
                  );
                }
              }
            );
            return;
          }
          session = await fetchAuthMeSession({ retryUnauthorized: false });
        }
      }

      if (session?.user) {
        applySession(
          session.user,
          session.tarotDaily ?? null,
          session.spreadCredits ?? 0
        );
        return;
      }

      if (fallbackUser) {
        applySession(fallbackUser, null, 0);
        return;
      }

      applySession(null, null, 0);
    } catch {
      if (fallbackUser) {
        applySession(fallbackUser, null, 0);
      } else {
        applySession(null, null, 0);
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
      spreadCredits,
      authSessionLoading,
      refreshAuthSession,
      setTarotDaily,
      setSpreadCredits,
    }),
    [
      authUser,
      tarotDaily,
      spreadCredits,
      authSessionLoading,
      refreshAuthSession,
    ]
  );

  return (
    <DataProvider Context={UserContext} value={value}>
      {children}
    </DataProvider>
  );
}
