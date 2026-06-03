const crypto = require('crypto');
const { getSupabaseAnonKey, getSupabaseUrl, requireEnv } = require('./oauthEnv');

const PKCE_TTL_MS = 15 * 60 * 1000;

function base64UrlEncode(buffer) {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function getPkceSecret() {
  const dedicated = process.env.OAUTH_PKCE_SECRET?.trim();
  if (dedicated) {
    return dedicated;
  }
  return requireEnv('SUPABASE_SERVICE_ROLE_KEY');
}

/** RFC 7636 verifier + S256 challenge (same algorithm as @supabase/auth-js). */
function generatePkcePair() {
  const verifier = base64UrlEncode(crypto.randomBytes(32));
  const challenge = base64UrlEncode(
    crypto.createHash('sha256').update(verifier).digest()
  );
  return { verifier, challenge, method: 's256' };
}

function signPkceParam(verifier) {
  const payload = base64UrlEncode(
    Buffer.from(
      JSON.stringify({ v: verifier, exp: Date.now() + PKCE_TTL_MS }),
      'utf8'
    )
  );
  const sig = base64UrlEncode(
    crypto.createHmac('sha256', getPkceSecret()).update(payload).digest()
  );
  return `${payload}.${sig}`;
}

function verifyPkceParam(token) {
  if (typeof token !== 'string' || !token.includes('.')) {
    throw new Error('PKCE_TOKEN_INVALID');
  }
  const [payload, sig] = token.split('.');
  const expected = base64UrlEncode(
    crypto.createHmac('sha256', getPkceSecret()).update(payload).digest()
  );
  if (sig !== expected) {
    throw new Error('PKCE_TOKEN_INVALID');
  }
  const { v, exp } = JSON.parse(
    Buffer.from(payload, 'base64url').toString('utf8')
  );
  if (!v || typeof v !== 'string') {
    throw new Error('PKCE_TOKEN_INVALID');
  }
  if (typeof exp !== 'number' || Date.now() > exp) {
    throw new Error('PKCE_TOKEN_EXPIRED');
  }
  return v;
}

function buildGoogleAuthorizeUrl({ redirectTo, challenge, method }) {
  const url = new URL(`${getSupabaseUrl()}/auth/v1/authorize`);
  url.searchParams.set('provider', 'google');
  url.searchParams.set('redirect_to', redirectTo);
  url.searchParams.set('code_challenge', challenge);
  url.searchParams.set('code_challenge_method', method);
  return url.toString();
}

async function exchangeCodeForSession(authCode, codeVerifier) {
  const anonKey = getSupabaseAnonKey();
  const tokenUrl = `${getSupabaseUrl()}/auth/v1/token?grant_type=pkce`;

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify({
      auth_code: authCode,
      code_verifier: codeVerifier,
    }),
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      body?.error_description || body?.msg || body?.error || response.statusText;
    const err = new Error(message || 'TOKEN_EXCHANGE_FAILED');
    err.status = response.status;
    throw err;
  }

  if (!body?.access_token) {
    throw new Error('TOKEN_EXCHANGE_MISSING_SESSION');
  }

  return {
    access_token: body.access_token,
    refresh_token: body.refresh_token,
    user: body.user,
  };
}

module.exports = {
  generatePkcePair,
  signPkceParam,
  verifyPkceParam,
  buildGoogleAuthorizeUrl,
  exchangeCodeForSession,
};
