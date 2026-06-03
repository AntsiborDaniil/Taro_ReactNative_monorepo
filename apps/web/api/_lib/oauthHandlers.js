const { createClient } = require('@supabase/supabase-js');
const {
  clearPkceCookies,
  redirectToApp,
  redirectOAuthProvider,
  setSessionCookie,
} = require('./oauthCookies');
const {
  buildGoogleAuthorizeUrl,
  exchangeCodeForSession,
  generatePkcePair,
  signPkceParam,
  verifyPkceParam,
} = require('./oauthPkce');
const {
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
  getRequestOrigin,
  oauthCallbackUrl,
  sanitizeOAuthNext,
} = require('./oauthEnv');

async function getPublicUser(accessToken) {
  const admin = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const {
    data: { user },
    error,
  } = await admin.auth.getUser(accessToken);

  if (error || !user) {
    return null;
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('id, email, name, created_at')
    .eq('id', user.id)
    .maybeSingle();

  if (profile) {
    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      createdAt: profile.created_at,
    };
  }

  return {
    id: user.id,
    email: user.email ?? '',
    name: user.user_metadata?.name ?? '',
    createdAt: user.created_at ?? new Date().toISOString(),
  };
}

async function handleGoogleOAuthStart(req, res) {
  const nextPath = sanitizeOAuthNext(req.query.next);
  const { verifier, challenge, method } = generatePkcePair();
  const pkceToken = signPkceParam(verifier);
  const redirectTo = `${oauthCallbackUrl(nextPath, req)}&pkce=${encodeURIComponent(pkceToken)}`;
  const authUrl = buildGoogleAuthorizeUrl({
    redirectTo,
    challenge,
    method,
  });

  redirectOAuthProvider(res, authUrl);
}

async function handleGoogleOAuthCallback(req, res) {
  const nextPath = sanitizeOAuthNext(req.query.next);
  const code = typeof req.query.code === 'string' ? req.query.code : undefined;
  const pkceToken =
    typeof req.query.pkce === 'string' ? req.query.pkce : undefined;

  if (!code) {
    throw new Error('OAUTH_CODE_MISSING');
  }
  if (!pkceToken) {
    throw new Error('PKCE_TOKEN_MISSING');
  }

  const codeVerifier = verifyPkceParam(pkceToken);
  const session = await exchangeCodeForSession(code, codeVerifier);
  clearPkceCookies(req, res);

  const publicUser = await getPublicUser(session.access_token);
  if (!publicUser) {
    throw new Error('USER_PROFILE_MISSING');
  }

  setSessionCookie(res, session.access_token);
  redirectToApp(
    res,
    req,
    `${getRequestOrigin(req)}${nextPath}`,
    'success'
  );
}

function handleOAuthError(res, req, nextPath, message) {
  clearPkceCookies(req, res);
  redirectToApp(
    res,
    req,
    `${getRequestOrigin(req)}${nextPath}`,
    'error',
    message
  );
}

module.exports = {
  handleGoogleOAuthStart,
  handleGoogleOAuthCallback,
  handleOAuthError,
};
