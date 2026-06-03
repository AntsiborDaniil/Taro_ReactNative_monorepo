import { parse, serialize, type SerializeOptions } from 'cookie';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getWebAppOrigin, isProduction } from './oauthEnv';

export const OAUTH_PKCE_BUNDLE_COOKIE = 'tarot_oauth_pkce';
export const AUTH_SESSION_COOKIE_NAME = 'tarot_session';

const SESSION_MAX_AGE_SEC = 30 * 24 * 60 * 60;
const PKCE_MAX_AGE_SEC = 15 * 60;

function baseCookieOptions(): SerializeOptions {
  return {
    path: '/',
    httpOnly: true,
    secure: isProduction(),
    sameSite: 'lax',
  };
}

export function appendSetCookie(res: VercelResponse, cookieHeader: string): void {
  const existing = res.getHeader('Set-Cookie');
  if (!existing) {
    res.setHeader('Set-Cookie', cookieHeader);
    return;
  }
  if (Array.isArray(existing)) {
    res.setHeader('Set-Cookie', [...existing, cookieHeader]);
    return;
  }
  res.setHeader('Set-Cookie', [String(existing), cookieHeader]);
}

function readPkceBundle(req: VercelRequest): Record<string, string> {
  const cookies = parse(req.headers.cookie ?? '');
  const raw = cookies[OAUTH_PKCE_BUNDLE_COOKIE];
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(
      Buffer.from(raw, 'base64url').toString('utf8')
    ) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, string>;
    }
  } catch {
    // ignore
  }
  return {};
}

function writePkceBundle(
  req: VercelRequest,
  res: VercelResponse,
  bundle: Record<string, string>
): void {
  const opts = { ...baseCookieOptions(), maxAge: PKCE_MAX_AGE_SEC };
  if (Object.keys(bundle).length === 0) {
    appendSetCookie(
      res,
      serialize(OAUTH_PKCE_BUNDLE_COOKIE, '', { ...opts, maxAge: 0 })
    );
    return;
  }
  const encoded = Buffer.from(JSON.stringify(bundle), 'utf8').toString(
    'base64url'
  );
  appendSetCookie(res, serialize(OAUTH_PKCE_BUNDLE_COOKIE, encoded, opts));
}

export function createPkceStorage(req: VercelRequest, res: VercelResponse) {
  const bundle = { ...readPkceBundle(req) };

  return {
    getItem(key: string): string | null {
      return bundle[key] ?? null;
    },
    setItem(key: string, value: string): void {
      bundle[key] = value;
      writePkceBundle(req, res, bundle);
    },
    removeItem(key: string): void {
      delete bundle[key];
      writePkceBundle(req, res, bundle);
    },
  };
}

export function clearPkceCookies(req: VercelRequest, res: VercelResponse): void {
  writePkceBundle(req, res, {});
}

export function setSessionCookie(
  res: VercelResponse,
  accessToken: string
): void {
  appendSetCookie(
    res,
    serialize(AUTH_SESSION_COOKIE_NAME, accessToken, {
      ...baseCookieOptions(),
      maxAge: SESSION_MAX_AGE_SEC,
    })
  );
}

export function redirectViaHtml(res: VercelResponse, targetUrl: string): void {
  const safeUrl = targetUrl
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');

  res
    .status(200)
    .setHeader('Content-Type', 'text/html; charset=utf-8')
    .setHeader('Cache-Control', 'no-store')
    .send(
      `<!DOCTYPE html><html><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${safeUrl}"><title>Redirecting</title></head><body><p>Redirecting…</p><script>location.replace(${JSON.stringify(targetUrl)});</script></body></html>`
    );
}

export function redirectToApp(
  res: VercelResponse,
  nextPath: string,
  status: 'success' | 'error',
  message?: string
): void {
  const url = new URL(nextPath, getWebAppOrigin());
  url.searchParams.set('auth', status);
  if (message) {
    url.searchParams.set('authMessage', message);
  }
  const target = url.toString();
  if (status === 'success') {
    redirectViaHtml(res, target);
    return;
  }
  res.redirect(302, target);
}
