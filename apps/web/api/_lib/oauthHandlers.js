const { createClient } = require('@supabase/supabase-js');
const {
  clearPkceCookies,
  createPkceStorage,
  redirectToApp,
  redirectViaHtml,
  setSessionCookie,
} = require('./oauthCookies');
const {
  getSupabaseAnonKey,
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
  getWebAppOrigin,
  oauthCallbackUrl,
  sanitizeOAuthNext,
} = require('./oauthEnv');

function createOAuthClient(req, res) {
  return createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: {
      flowType: 'pkce',
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
      storage: createPkceStorage(req, res),
    },
  });
}

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
  const supabase = createOAuthClient(req, res);
  const redirectTo = oauthCallbackUrl(nextPath);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error || !data?.url) {
    throw error ?? new Error('OAUTH_URL_MISSING');
  }

  redirectViaHtml(res, data.url);
}

async function handleGoogleOAuthCallback(req, res) {
  const nextPath = sanitizeOAuthNext(req.query.next);
  const code = typeof req.query.code === 'string' ? req.query.code : undefined;

  if (!code) {
    throw new Error('OAUTH_CODE_MISSING');
  }

  const supabase = createOAuthClient(req, res);
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  clearPkceCookies(req, res);

  if (error || !data?.session) {
    throw error ?? new Error('OAUTH_SESSION_MISSING');
  }

  const publicUser = await getPublicUser(data.session.access_token);
  if (!publicUser) {
    throw new Error('USER_PROFILE_MISSING');
  }

  setSessionCookie(res, data.session.access_token);
  redirectToApp(res, `${getWebAppOrigin()}${nextPath}`, 'success');
}

function handleOAuthError(res, nextPath, message) {
  redirectToApp(res, `${getWebAppOrigin()}${nextPath}`, 'error', message);
}

module.exports = {
  handleGoogleOAuthStart,
  handleGoogleOAuthCallback,
  handleOAuthError,
};
