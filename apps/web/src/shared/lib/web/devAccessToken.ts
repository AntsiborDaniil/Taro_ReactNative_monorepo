const DEV_TOKEN_KEY = 'tarot_dev_access_token';

export function setDevAccessToken(token: string | null): void {
  if (typeof sessionStorage === 'undefined') {
    return;
  }
  try {
    if (token) {
      sessionStorage.setItem(DEV_TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(DEV_TOKEN_KEY);
    }
  } catch {
    // ignore
  }
}

export function getDevAccessToken(): string | null {
  if (typeof sessionStorage === 'undefined') {
    return null;
  }
  try {
    return sessionStorage.getItem(DEV_TOKEN_KEY);
  } catch {
    return null;
  }
}
