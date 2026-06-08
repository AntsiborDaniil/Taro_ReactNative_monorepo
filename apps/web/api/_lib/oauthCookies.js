const { parse, serialize } = require('cookie');
const { getRequestOrigin, isProduction } = require('./oauthEnv');

const OAUTH_PKCE_BUNDLE_COOKIE = 'tarot_oauth_pkce';
/** Backup cookie — browsers handle Set-Cookie on 302 more reliably than bundle-only. */
const TAROT_PKCE_VERIFIER_COOKIE = 'tarot_pkce_verifier';
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

function writePkceBundle(res, bundle) {
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

function writeVerifierCookie(res, verifier) {
  const opts = { ...baseCookieOptions(), maxAge: PKCE_MAX_AGE_SEC };
  if (!verifier) {
    appendSetCookie(
      res,
      serialize(TAROT_PKCE_VERIFIER_COOKIE, '', { ...opts, maxAge: 0 })
    );
    return;
  }
  appendSetCookie(
    res,
    serialize(TAROT_PKCE_VERIFIER_COOKIE, verifier, opts)
  );
}

function isCodeVerifierKey(key) {
  return typeof key === 'string' && key.endsWith('-code-verifier');
}

function createPkceStorage(req, res) {
  const bundle = { ...readPkceBundle(req) };

  return {
    getItem(key) {
      const fromBundle = bundle[key];
      if (fromBundle) {
        return fromBundle;
      }
      if (isCodeVerifierKey(key)) {
        const cookies = parse(req.headers.cookie ?? '');
        const dedicated = cookies[TAROT_PKCE_VERIFIER_COOKIE];
        if (dedicated) {
          // Supabase setItemAsync stores JSON.stringify(verifier).
          return JSON.stringify(dedicated);
        }
      }
      return null;
    },
    setItem(key, value) {
      bundle[key] = value;
      writePkceBundle(res, bundle);
      if (isCodeVerifierKey(key)) {
        try {
          const verifier = JSON.parse(value);
          writeVerifierCookie(res, typeof verifier === 'string' ? verifier : '');
        } catch {
          writeVerifierCookie(res, '');
        }
      }
    },
    removeItem(key) {
      delete bundle[key];
      writePkceBundle(res, bundle);
      if (isCodeVerifierKey(key)) {
        writeVerifierCookie(res, '');
      }
    },
  };
}

function clearPkceCookies(req, res) {
  writePkceBundle(res, {});
  writeVerifierCookie(res, '');
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

function clearSessionCookie(res) {
  appendSetCookie(
    res,
    serialize(AUTH_SESSION_COOKIE_NAME, '', {
      ...baseCookieOptions(),
      maxAge: 0,
    })
  );
}

/** 302 — browsers persist Set-Cookie before leaving to Google (unlike meta/JS redirect). */
function redirectOAuthProvider(res, targetUrl) {
  res.status(302);
  res.setHeader('Location', targetUrl);
  res.setHeader('Cache-Control', 'no-store');
  res.end();
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

function redirectToApp(res, req, nextPath, status, message) {
  const url = new URL(nextPath, getRequestOrigin(req));
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
  TAROT_PKCE_VERIFIER_COOKIE,
  AUTH_SESSION_COOKIE_NAME,
  appendSetCookie,
  createPkceStorage,
  clearPkceCookies,
  setSessionCookie,
  clearSessionCookie,
  redirectOAuthProvider,
  redirectViaHtml,
  redirectToApp,
};
