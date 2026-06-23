const { AUTH_SESSION_COOKIE_NAME, setSessionCookie, clearSessionCookie } = require('./oauthCookies');

const DEFAULT_BFF = 'https://taro-reactnative-monorepo.onrender.com';

/** Routes that create a session — we set tarot_session on the Vercel domain from JSON token. */
const SESSION_BODY_ROUTES = new Set(['signin', 'signup', 'verify-email', 'telegram']);

const CLEAR_SESSION_ROUTES = new Set(['signout']);

function getBffBaseUrl() {
  const configured = process.env.TAROT_API_PROXY_URL?.trim();
  return (configured || DEFAULT_BFF).replace(/\/$/, '');
}

function buildUpstreamHeaders(req, { omitWebCookieAuth }) {
  const headers = {};

  const contentType = req.headers['content-type'];
  if (contentType) {
    headers['Content-Type'] = Array.isArray(contentType)
      ? contentType[0]
      : contentType;
  }

  if (req.headers.cookie) {
    headers.Cookie = req.headers.cookie;
  }

  if (!omitWebCookieAuth) {
    const webCookieAuth = req.headers['x-web-cookie-auth'];
    if (webCookieAuth) {
      headers['X-Web-Cookie-Auth'] = Array.isArray(webCookieAuth)
        ? webCookieAuth[0]
        : webCookieAuth;
    }
  }

  return headers;
}

function readRequestBody(req) {
  if (req.method === 'GET' || req.method === 'HEAD') {
    return undefined;
  }

  if (typeof req.body === 'string') {
    return req.body;
  }

  if (req.body && typeof req.body === 'object') {
    return JSON.stringify(req.body);
  }

  return undefined;
}

/**
 * Proxy /api/auth/* to Render BFF and set HttpOnly session cookie on this host.
 * Vercel rewrites drop upstream Set-Cookie — session routes must pass through here.
 */
async function proxyAuthRoute(req, res, authPath) {
  if (!authPath || authPath.startsWith('oauth/')) {
    res.status(404).json({ message: 'Not found' });
    return;
  }

  const upstreamUrl = `${getBffBaseUrl()}/api/auth/${authPath}`;
  const isSessionRoute = SESSION_BODY_ROUTES.has(authPath);
  const isClearSession = CLEAR_SESSION_ROUTES.has(authPath);

  const upstream = await fetch(upstreamUrl, {
    method: req.method,
    headers: buildUpstreamHeaders(req, { omitWebCookieAuth: isSessionRoute }),
    body: readRequestBody(req),
  });

  const text = await upstream.text();
  let json = null;
  if (text.trim()) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }

  if (isClearSession && upstream.ok) {
    clearSessionCookie(res);
  }

  if (isSessionRoute && upstream.ok && json?.token) {
    setSessionCookie(res, json.token);
    const { token: _t, refreshToken: _r, ...clientBody } = json;
    res.status(upstream.status).json(clientBody);
    return;
  }

  const contentType =
    upstream.headers.get('content-type') || 'application/json';
  res.status(upstream.status);
  res.setHeader('Content-Type', contentType);
  res.send(text);
}

module.exports = {
  AUTH_SESSION_COOKIE_NAME,
  proxyAuthRoute,
  getBffBaseUrl,
};
