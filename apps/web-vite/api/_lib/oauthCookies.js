const { serialize } = require('cookie');
const { isProduction } = require('./oauthEnv');

const AUTH_SESSION_COOKIE_NAME = 'tarot_session';
const SESSION_MAX_AGE_SEC = 30 * 24 * 60 * 60;

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

module.exports = {
  AUTH_SESSION_COOKIE_NAME,
  appendSetCookie,
  setSessionCookie,
  clearSessionCookie,
};
