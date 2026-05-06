import { Platform } from 'react-native';

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
