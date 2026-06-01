import { Linking, Platform } from 'react-native';
import { getTarotAiApiBaseUrl } from './tarotAiBaseUrl';

/** Web: JWT lives in HttpOnly cookie; native: Bearer token from API JSON. */
export function authUsesCookie(): boolean {
  return Platform.OS === 'web';
}

export function authCredentials(): RequestCredentials {
  return authUsesCookie() ? 'include' : 'omit';
}

/** Headers for authenticated requests (cookie on web, Bearer on native). */
export function authRequestHeaders(token: string | null): Record<string, string> {
  const headers: Record<string, string> = {};
  if (!authUsesCookie() && token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Sign-up / sign-in only: ask API not to echo JWT in JSON when web uses cookie.
 */
export function authSignHeaders(): Record<string, string> {
  if (authUsesCookie()) {
    return { 'X-Web-Cookie-Auth': '1' };
  }
  return {};
}

/** Redirect to API Google OAuth (sets session cookie on callback). */
export function startGoogleSignIn(): void {
  const base = getTarotAiApiBaseUrl();
  const next =
    Platform.OS === 'web' && typeof window !== 'undefined'
      ? `${window.location.pathname}${window.location.search}`
      : '/';
  const url = `${base}/api/auth/oauth/google?next=${encodeURIComponent(next)}`;

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.location.href = url;
    return;
  }

  Linking.openURL(url).catch(() => undefined);
}
