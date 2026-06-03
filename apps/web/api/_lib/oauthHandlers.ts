import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  clearPkceCookies,
  createPkceStorage,
  redirectToApp,
  redirectViaHtml,
  setSessionCookie,
} from './oauthCookies';
import {
  getSupabaseAnonKey,
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
  getWebAppOrigin,
  oauthCallbackUrl,
  sanitizeOAuthNext,
} from './oauthEnv';

type PublicUser = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

function createOAuthClient(req: VercelRequest, res: VercelResponse) {
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

async function getPublicUser(accessToken: string): Promise<PublicUser | null> {
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
    name: (user.user_metadata?.name as string | undefined) ?? '',
    createdAt: user.created_at ?? new Date().toISOString(),
  };
}

export async function handleGoogleOAuthStart(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
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

  if (error || !data.url) {
    throw error ?? new Error('OAUTH_URL_MISSING');
  }

  redirectViaHtml(res, data.url);
}

export async function handleGoogleOAuthCallback(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  const nextPath = sanitizeOAuthNext(req.query.next);
  const code = typeof req.query.code === 'string' ? req.query.code : undefined;

  if (!code) {
    throw new Error('OAUTH_CODE_MISSING');
  }

  const supabase = createOAuthClient(req, res);
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  clearPkceCookies(req, res);

  if (error || !data.session) {
    throw error ?? new Error('OAUTH_SESSION_MISSING');
  }

  const publicUser = await getPublicUser(data.session.access_token);
  if (!publicUser) {
    throw new Error('USER_PROFILE_MISSING');
  }

  setSessionCookie(res, data.session.access_token);
  redirectToApp(res, `${getWebAppOrigin()}${nextPath}`, 'success');
}

export function handleOAuthError(
  res: VercelResponse,
  nextPath: string,
  message: string
): void {
  redirectToApp(res, `${getWebAppOrigin()}${nextPath}`, 'error', message);
}
