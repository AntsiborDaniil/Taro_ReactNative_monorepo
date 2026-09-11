const TOKEN_KEY = 'tarot_admin_token';

export type AdminMe = {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'supervisor';
};

export function getApiBase(): string {
  const raw = (import.meta.env.VITE_API_BASE as string | undefined)?.trim();
  return raw ? raw.replace(/\/$/, '') : '';
}

export function getAdminToken(): string | null {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setAdminToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearAdminToken(): void {
  window.localStorage.removeItem(TOKEN_KEY);
}

export function adminHeaders(init?: HeadersInit): Headers {
  const headers = new Headers(init);
  const token = getAdminToken();
  if (token && token !== 'cookie') {
    headers.set('Authorization', `Bearer ${token}`);
  }
  headers.set('Accept', 'application/json');
  return headers;
}

export async function fetchAdminMe(): Promise<AdminMe | null> {
  const response = await fetch(`${getApiBase()}/api/admin/me`, {
    headers: adminHeaders(),
    credentials: 'include',
  });
  if (!response.ok) {
    return null;
  }
  const body = (await response.json().catch(() => ({}))) as { user?: AdminMe };
  if (!body.user?.id || (body.user.role !== 'admin' && body.user.role !== 'supervisor')) {
    return null;
  }
  return body.user;
}

export async function adminSignIn(
  email: string,
  password: string
): Promise<{ token: string; user: AdminMe }> {
  const response = await fetch(`${getApiBase()}/api/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  const body = (await response.json().catch(() => ({}))) as {
    token?: string;
    user?: { email: string; name: string };
    message?: string;
  };
  if (!response.ok) {
    throw new Error(body.message || 'Неверный логин или пароль');
  }

  if (body.token) {
    setAdminToken(body.token);
  }

  const me = await fetchAdminMe();
  if (!me) {
    clearAdminToken();
    await fetch(`${getApiBase()}/api/auth/signout`, {
      method: 'POST',
      credentials: 'include',
    }).catch(() => undefined);
    throw new Error('Нет доступа в админку');
  }

  return { token: body.token || 'cookie', user: me };
}

export async function adminSignOut(): Promise<void> {
  clearAdminToken();
  await fetch(`${getApiBase()}/api/auth/signout`, {
    method: 'POST',
    credentials: 'include',
  }).catch(() => undefined);
}
