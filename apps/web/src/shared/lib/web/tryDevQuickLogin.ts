import {
  authCredentials,
  authSignHeaders,
  getTarotAiApiBaseUrl,
} from 'shared/api';
import type { AuthSessionUser } from 'entities/user/model/types';
import { setDevAccessToken } from './devAccessToken';

export type DevQuickLoginResult = {
  ok: boolean;
  user?: AuthSessionUser;
};

/** Auto-login demo session when EXPO_PUBLIC_DEV_QUICK_LOGIN=1 (memory API only). */
export function isDevQuickLoginEnabled(): boolean {
  const raw = process.env.EXPO_PUBLIC_DEV_QUICK_LOGIN?.trim().toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'yes';
}

/**
 * POST /api/auth/dev/quick-login — cookie + Bearer token backup for local UI.
 * Must send JSON body `{}` (Fastify rejects empty application/json).
 */
export async function tryDevQuickLogin(): Promise<DevQuickLoginResult> {
  if (!isDevQuickLoginEnabled()) {
    return { ok: false };
  }

  try {
    const response = await fetch(
      `${getTarotAiApiBaseUrl()}/api/auth/dev/quick-login`,
      {
        method: 'POST',
        credentials: authCredentials(),
        headers: {
          'Content-Type': 'application/json',
          ...authSignHeaders(),
        },
        body: '{}',
      }
    );

    if (!response.ok) {
      if (__DEV__) {
        console.warn(
          '[dev] quick-login failed',
          response.status,
          '— start API with memory backend (placeholder SUPABASE_* or USE_MEMORY_BACKEND=1)'
        );
      }
      return { ok: false };
    }

    const data = (await response.json()) as {
      user?: AuthSessionUser;
      token?: string;
    };

    if (data?.token) {
      setDevAccessToken(data.token);
    }

    if (data?.user?.id) {
      return { ok: true, user: data.user };
    }

    return { ok: true };
  } catch (error) {
    if (__DEV__) {
      console.warn('[dev] quick-login unreachable', error);
    }
    return { ok: false };
  }
}
