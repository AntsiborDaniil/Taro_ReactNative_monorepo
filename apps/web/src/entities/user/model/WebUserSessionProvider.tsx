import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import {
  authCredentials,
  authRequestHeaders,
  getTarotAiApiBaseUrl,
  SubscriptionType,
} from 'shared/api';
import type { AuthSessionUser, TarotDailyQuota } from './types';
import { UserContext } from './UserContext';
import { DataProvider } from 'shared/DataProvider';
import { TAROT_AUTH_CHANGED_EVENT } from 'shared/lib/tarotAuthEvents';

type MeResponse = {
  user: AuthSessionUser;
  tarotDaily?: TarotDailyQuota;
};

export function WebUserSessionProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<AuthSessionUser | null>(null);
  const [tarotDaily, setTarotDaily] = useState<TarotDailyQuota | null>(null);
  const [authSessionLoading, setAuthSessionLoading] = useState(true);

  const loadMe = useCallback(async () => {
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
        setAuthUser(null);
        setTarotDaily(null);
        return;
      }

      const body = (await response.json()) as MeResponse;
      setAuthUser(body.user);
      setTarotDaily(body.tarotDaily ?? null);
    } catch {
      setAuthUser(null);
      setTarotDaily(null);
    } finally {
      setAuthSessionLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMe();
  }, [loadMe]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      return;
    }
    const onAuthChanged = () => {
      void loadMe();
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
