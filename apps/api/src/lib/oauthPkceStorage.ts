import type { CookieSerializeOptions } from '@fastify/cookie';
import type { FastifyReply, FastifyRequest } from 'fastify';

/** Single cookie for all Supabase PKCE keys (Vercel proxy may drop multiple Set-Cookie on 302). */
export const OAUTH_PKCE_BUNDLE_COOKIE = 'tarot_oauth_pkce';

const LEGACY_OAUTH_COOKIE_PREFIX = 'sb_oauth_';
const OAUTH_COOKIE_MAX_AGE_SEC = 15 * 60;

function isSecureRequest(request: FastifyRequest): boolean {
  if (process.env.NODE_ENV !== 'production') {
    return false;
  }
  const raw = request.headers['x-forwarded-proto'];
  const proto = Array.isArray(raw) ? raw[0] : raw;
  return !proto || proto.split(',')[0]?.trim() === 'https';
}

export function oauthCookieOptions(
  request: FastifyRequest
): CookieSerializeOptions {
  return {
    path: '/',
    httpOnly: true,
    secure: isSecureRequest(request),
    sameSite: 'lax',
    maxAge: OAUTH_COOKIE_MAX_AGE_SEC,
  };
}

function readBundleFromRequest(
  request: FastifyRequest
): Record<string, string> {
  const raw = request.cookies[OAUTH_PKCE_BUNDLE_COOKIE];
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
    // ignore corrupt bundle
  }
  return {};
}

function writeBundleCookie(
  request: FastifyRequest,
  reply: FastifyReply,
  bundle: Record<string, string>
): void {
  const keys = Object.keys(bundle);
  if (keys.length === 0) {
    reply.clearCookie(OAUTH_PKCE_BUNDLE_COOKIE, oauthCookieOptions(request));
    return;
  }

  const encoded = Buffer.from(JSON.stringify(bundle), 'utf8').toString(
    'base64url'
  );
  reply.setCookie(OAUTH_PKCE_BUNDLE_COOKIE, encoded, oauthCookieOptions(request));
}

/** In-memory bundle for the current request (sign-in may call setItem several times). */
export function createOAuthPkceStorage(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const bundle = { ...readBundleFromRequest(request) };

  return {
    getItem(key: string): string | null {
      return bundle[key] ?? null;
    },
    setItem(key: string, value: string): void {
      bundle[key] = value;
      writeBundleCookie(request, reply, bundle);
    },
    removeItem(key: string): void {
      delete bundle[key];
      writeBundleCookie(request, reply, bundle);
    },
  };
}

export function clearOAuthPkceCookies(
  request: FastifyRequest,
  reply: FastifyReply
): void {
  const opts = oauthCookieOptions(request);
  reply.clearCookie(OAUTH_PKCE_BUNDLE_COOKIE, opts);

  for (const name of Object.keys(request.cookies)) {
    if (name.startsWith(LEGACY_OAUTH_COOKIE_PREFIX)) {
      reply.clearCookie(name, opts);
    }
  }
}

/** HTML redirect so the browser applies Set-Cookie before leaving for Google. */
export function redirectViaHtml(
  reply: FastifyReply,
  targetUrl: string
): FastifyReply {
  const safeUrl = targetUrl
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');

  return reply
    .type('text/html; charset=utf-8')
    .header('Cache-Control', 'no-store')
    .send(
      `<!DOCTYPE html><html><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${safeUrl}"><title>Redirecting</title></head><body><p>Redirecting…</p><script>location.replace(${JSON.stringify(targetUrl)});</script></body></html>`
    );
}
