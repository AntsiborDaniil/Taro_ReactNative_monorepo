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

const ME_RETRY_DELAYS_MS = [0, 80, 200, 400, 800];

export async function fetchAuthMeSession(options?: {
  retryUnauthorized?: boolean;
}): Promise<AuthMeSession | null> {
  const retryUnauthorized = options?.retryUnauthorized ?? true;
  const delays = retryUnauthorized ? ME_RETRY_DELAYS_MS : [0];

  for (const delayMs of delays) {
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    try {
      const response = await fetch(`${getTarotAiApiBaseUrl()}/api/auth/me`, {
        credentials: authCredentials(),
        headers: authRequestHeaders(null),
      });

      if (response.ok) {
        return (await response.json()) as AuthMeSession;
      }

      if (response.status !== 401 || !retryUnauthorized) {
        return null;
      }
    } catch {
      // retry on network errors
    }
  }

  return null;
}
