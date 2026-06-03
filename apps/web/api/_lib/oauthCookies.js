const { parse, serialize } = require('cookie');
const { getWebAppOrigin, isProduction } = require('./oauthEnv');

const OAUTH_PKCE_BUNDLE_COOKIE = 'tarot_oauth_pkce';
const AUTH_SESSION_COOKIE_NAME = 'tarot_session';

const SESSION_MAX_AGE_SEC = 30 * 24 * 60 * 60;
const PKCE_MAX_AGE_SEC = 15 * 60;

function baseCookieOptions() {
  return {
    path: '/',
    httpOnly: true,
    secure: isProduction(),
    sameSite: 'lax',
  };
}

function appendSetCookie(res, cookieHeader) {
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

function readPkceBundle(req) {
  const cookies = parse(req.headers.cookie ?? '');
  const raw = cookies[OAUTH_PKCE_BUNDLE_COOKIE];
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // ignore
  }
  return {};
}

function writePkceBundle(req, res, bundle) {
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

function createPkceStorage(req, res) {
  const bundle = { ...readPkceBundle(req) };

  return {
    getItem(key) {
      return bundle[key] ?? null;
    },
    setItem(key, value) {
      bundle[key] = value;
      writePkceBundle(req, res, bundle);
    },
    removeItem(key) {
      delete bundle[key];
      writePkceBundle(req, res, bundle);
    },
  };
}

function clearPkceCookies(req, res) {
  writePkceBundle(req, res, {});
}

function setSessionCookie(res, accessToken) {
  appendSetCookie(
    res,
    serialize(AUTH_SESSION_COOKIE_NAME, accessToken, {
      ...baseCookieOptions(),
      maxAge: SESSION_MAX_AGE_SEC,
    })
  );
}

function redirectViaHtml(res, targetUrl) {
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

function redirectToApp(res, nextPath, status, message) {
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

module.exports = {
  OAUTH_PKCE_BUNDLE_COOKIE,
  AUTH_SESSION_COOKIE_NAME,
  appendSetCookie,
  createPkceStorage,
  clearPkceCookies,
  setSessionCookie,
  redirectViaHtml,
  redirectToApp,
};
