import type {
  AuthSessionUser,
  TarotDailyQuota,
} from 'entities/user/model/types';
import {
  authCredentials,
  authRequestHeaders,
  getTarotAiApiBaseUrl,
} from 'shared/api';

export type AuthMeSession = {
  user: AuthSessionUser;
  tarotDaily?: TarotDailyQuota | null;
};

const ME_RETRY_DELAYS_MS = [0, 100, 250, 500, 1000, 2000];
const AUTH_ME_CACHE_KEY = 'tarot_auth_me_session';

function readCachedAuthMeSession(): AuthMeSession | null {
  if (typeof sessionStorage === 'undefined') {
    return null;
  }

  try {
    const raw = sessionStorage.getItem(AUTH_ME_CACHE_KEY);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as AuthMeSession;
  } catch {
    return null;
  }
}

function writeCachedAuthMeSession(session: AuthMeSession | null): void {
  if (typeof sessionStorage === 'undefined') {
    return;
  }

  try {
    if (session?.user) {
      sessionStorage.setItem(AUTH_ME_CACHE_KEY, JSON.stringify(session));
      return;
    }

    sessionStorage.removeItem(AUTH_ME_CACHE_KEY);
  } catch {
    // ignore quota / private mode
  }
}

export async function fetchAuthMeSession(options?: {
  retryUnauthorized?: boolean;
  /** Keep session when CDN/proxy returns 304 Not Modified (empty body). */
  previousSession?: AuthMeSession | null;
}): Promise<AuthMeSession | null> {
  const retryUnauthorized = options?.retryUnauthorized ?? true;
  const delays = retryUnauthorized ? ME_RETRY_DELAYS_MS : [0];
  const cachedSession = readCachedAuthMeSession();
  const previousSession = options?.previousSession ?? cachedSession;

  for (const delayMs of delays) {
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    try {
      const response = await fetch(`${getTarotAiApiBaseUrl()}/api/auth/me`, {
        credentials: authCredentials(),
        headers: {
          ...authRequestHeaders(null),
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
        cache: 'no-store',
      });

      if (response.status === 304) {
        if (previousSession) {
          return previousSession;
        }
        continue;
      }

      if (response.ok) {
        const session = (await response.json()) as AuthMeSession;
        writeCachedAuthMeSession(session);
        return session;
      }

      if (response.status === 401) {
        writeCachedAuthMeSession(null);
        if (!retryUnauthorized) {
          return null;
        }
        continue;
      }

      return previousSession ?? null;
    } catch {
      // retry on network errors
    }
  }

  return previousSession ?? null;
}
