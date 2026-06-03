import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  authCredentials,
  authRequestHeaders,
  getTarotAiApiBaseUrl,
  SubscriptionType,
} from 'shared/api';
import type { AuthSessionUser, TarotDailyQuota } from './types';
import { UserContext } from './UserContext';
import { DataProvider } from 'shared/DataProvider';
import { handleWebOAuthReturn } from 'shared/lib/handleWebOAuthReturn';
import {
  TAROT_AUTH_CHANGED_EVENT,
  type TarotAuthChangedDetail,
} from 'shared/lib/tarotAuthEvents';
import { migrateLocalDataToCloud } from 'shared/lib/cloudMigration/migrateLocalToCloud';

type MeResponse = {
  user: AuthSessionUser;
  tarotDaily?: TarotDailyQuota;
};

export function WebUserSessionProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation('settings');
  const [authUser, setAuthUser] = useState<AuthSessionUser | null>(null);
  const [tarotDaily, setTarotDaily] = useState<TarotDailyQuota | null>(null);
  const [authSessionLoading, setAuthSessionLoading] = useState(true);
  const loadMe = useCallback(async (fallbackUser?: AuthSessionUser) => {
    if (Platform.OS !== 'web') {
      setAuthSessionLoading(false);
      return;
    }
    try {
      const response = await fetch(`${getTarotAiApiBaseUrl()}/api/auth/me`, {
        credentials: authCredentials(),
        headers: {
          ...authRequestHeaders(null),
        },
      });

      if (!response.ok) {
        if (fallbackUser) {
          setAuthUser(fallbackUser);
          setTarotDaily(null);
        } else {
          setAuthUser(null);
          setTarotDaily(null);
        }
        return;
      }

      const body = (await response.json()) as MeResponse;
      setAuthUser(body.user);
      setTarotDaily(body.tarotDaily ?? null);
      if (body.user?.id) {
        void migrateLocalDataToCloud(body.user.id);
      }
    } catch {
      if (fallbackUser) {
        setAuthUser(fallbackUser);
        setTarotDaily(null);
      } else {
        setAuthUser(null);
        setTarotDaily(null);
      }
    } finally {
      setAuthSessionLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMe();
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
    }),
    [authUser, tarotDaily, authSessionLoading, refreshAuthSession]
  );

  return (
    <DataProvider Context={UserContext} value={value}>
      {children}
    </DataProvider>
  );
}
