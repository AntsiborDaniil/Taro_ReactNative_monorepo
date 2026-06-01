import {
  authCredentials,
  authRequestHeaders,
  getTarotAiApiBaseUrl,
} from 'shared/api';

export type CloudFetchResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; status: number; message?: string };

export async function cloudFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<CloudFetchResult<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...authRequestHeaders(null),
    ...(init.headers as Record<string, string> | undefined),
  };

  try {
    const response = await fetch(`${getTarotAiApiBaseUrl()}${path}`, {
      ...init,
      credentials: authCredentials(),
      headers,
    });

    if (!response.ok) {
      let message: string | undefined;
      try {
        const body = (await response.json()) as { message?: string };
        message = body.message;
      } catch {
        // ignore
      }
      return { ok: false, status: response.status, message };
    }

    if (response.status === 204) {
      return { ok: true, data: undefined as T, status: response.status };
    }

    const data = (await response.json()) as T;
    return { ok: true, data, status: response.status };
  } catch {
    return { ok: false, status: 0 };
  }
}

export async function isCloudSessionActive(): Promise<boolean> {
  const result = await cloudFetch<{ user: { id: string } }>('/api/auth/me');
  return result.ok;
}
