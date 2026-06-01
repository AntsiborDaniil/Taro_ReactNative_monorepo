import type { FastifyReply, FastifyRequest } from 'fastify';
import { logAuthEmail, logAuthSignupComplete } from '../lib/authEmailLog';
import { useMemoryBackend } from '../lib/devMode';
import { assertStrongPassword } from '../lib/passwordPolicy';
import { getApiPublicUrl } from '../lib/appUrls';
import {
  clearOAuthCookies,
  createOAuthSupabaseClient,
} from '../lib/supabaseOAuth';
import { getSupabaseAdmin, getSupabaseAnon } from '../lib/supabase';
import * as memory from '../dev/memoryBackend';

export type AuthPublicUser = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

export type AuthSession = {
  token: string;
  refreshToken: string;
  user: AuthPublicUser;
};

export type SignUpResult =
  | { kind: 'session'; session: AuthSession }
  | {
      kind: 'emailVerification';
      email: string;
      devVerificationCode?: string;
    };

function mapProfile(row: {
  id: string;
  email: string;
  name: string;
  created_at: string;
}): AuthPublicUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    createdAt: row.created_at,
  };
}

export async function getPublicUserByAccessToken(
  accessToken: string
): Promise<AuthPublicUser | null> {
  if (useMemoryBackend()) {
    return memory.memoryGetPublicUserByAccessToken(accessToken);
  }

  const admin = getSupabaseAdmin();
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
    return mapProfile(profile);
  }

  return {
    id: user.id,
    email: user.email ?? '',
    name: (user.user_metadata?.name as string | undefined) ?? '',
    createdAt: user.created_at ?? new Date().toISOString(),
  };
}

function mapSession(
  accessToken: string,
  refreshToken: string,
  user: AuthPublicUser
): AuthSession {
  return {
    token: accessToken,
    refreshToken,
    user,
  };
}

export async function signUp({
  name,
  email,
  password,
}: {
  name: string;
  email: string;
  password: string;
}): Promise<SignUpResult> {
  assertStrongPassword(password);

  if (useMemoryBackend()) {
    const result = memory.memorySignUp({ name, email, password });
    if (result.kind === 'emailVerification') {
      return result;
    }
    return { kind: 'session', session: result.session };
  }

  const supabase = getSupabaseAnon();
  const normalizedEmail = email.trim().toLowerCase();
  const trimmedName = name.trim();

  // OTP email (6-digit code), not magic-link confirm — requires Supabase email OTP template.
  const { error } = await supabase.auth.signInWithOtp({
    email: normalizedEmail,
    options: {
      shouldCreateUser: true,
      data: { name: trimmedName },
    },
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (
      msg.includes('already registered') ||
      msg.includes('already exists') ||
      msg.includes('user already')
    ) {
      throw new Error('USER_ALREADY_EXISTS');
    }
    throw error;
  }

  logAuthEmail({
    to: normalizedEmail,
    kind: 'signup_confirmation',
    simulated: false,
  });
  return { kind: 'emailVerification', email: normalizedEmail };
}

export async function verifyEmailOtp({
  email,
  code,
  password,
  name,
}: {
  email: string;
  code: string;
  password?: string;
  name?: string;
}): Promise<AuthSession> {
  if (useMemoryBackend()) {
    return memory.memoryVerifyEmailOtp({ email, code });
  }

  const supabase = getSupabaseAnon();
  const normalizedEmail = email.trim().toLowerCase();
  const token = code.trim();

  if (password) {
    assertStrongPassword(password);
  }

  const signupAttempt = await supabase.auth.verifyOtp({
    email: normalizedEmail,
    token,
    type: 'signup',
  });

  let data = signupAttempt.data;
  let error = signupAttempt.error;

  if (error || !data.session) {
    const emailAttempt = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token,
      type: 'email',
    });
    data = emailAttempt.data;
    error = emailAttempt.error;
  }

  if (error || !data.session) {
    throw new Error('INVALID_VERIFICATION_CODE');
  }

  if (password && data.user) {
    const admin = getSupabaseAdmin();
    const metadata: Record<string, string> = {};
    if (name?.trim()) {
      metadata.name = name.trim();
    }
    const { error: pwError } = await admin.auth.admin.updateUserById(
      data.user.id,
      {
        password,
        ...(Object.keys(metadata).length > 0
          ? { user_metadata: metadata }
          : {}),
      }
    );
    if (pwError) {
      throw pwError;
    }
  }

  const publicUser = await getPublicUserByAccessToken(data.session.access_token);
  if (!publicUser) {
    throw new Error('USER_PROFILE_MISSING');
  }

  logAuthSignupComplete(publicUser.email, publicUser.id);

  return mapSession(
    data.session.access_token,
    data.session.refresh_token,
    publicUser
  );
}

export async function resendEmailVerificationCode(
  email: string
): Promise<string | undefined> {
  const normalizedEmail = email.trim().toLowerCase();

  if (useMemoryBackend()) {
    return memory.memoryResendVerificationCode(normalizedEmail);
  }

  const supabase = getSupabaseAnon();
  const { error } = await supabase.auth.signInWithOtp({
    email: normalizedEmail,
    options: { shouldCreateUser: false },
  });

  if (error) {
    throw error;
  }

  logAuthEmail({
    to: normalizedEmail,
    kind: 'signup_resend',
    simulated: false,
  });

  return undefined;
}

export async function signIn({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<AuthSession> {
  if (useMemoryBackend()) {
    return memory.memorySignIn({ email, password });
  }

  const supabase = getSupabaseAnon();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('email not confirmed') || msg.includes('not confirmed')) {
      throw new Error('EMAIL_NOT_CONFIRMED');
    }
    throw new Error('INVALID_CREDENTIALS');
  }

  if (!data.session || !data.user) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const publicUser = await getPublicUserByAccessToken(data.session.access_token);
  if (!publicUser) {
    throw new Error('INVALID_CREDENTIALS');
  }

  return mapSession(
    data.session.access_token,
    data.session.refresh_token,
    publicUser
  );
}

export async function updateProfile(
  userId: string,
  updates: { name: string }
): Promise<AuthPublicUser | null> {
  if (useMemoryBackend()) {
    return memory.memoryUpdateProfile(userId, updates);
  }

  const admin = getSupabaseAdmin();
  const name = updates.name.trim();

  const { data, error } = await admin
    .from('profiles')
    .update({ name })
    .eq('id', userId)
    .select('id, email, name, created_at')
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapProfile(data);
}

export async function changePassword({
  userId,
  email,
  currentPassword,
  newPassword,
}: {
  userId: string;
  email: string;
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  assertStrongPassword(newPassword);

  if (useMemoryBackend()) {
    memory.memoryChangePassword({ userId, email, currentPassword, newPassword });
    return;
  }

  const anon = getSupabaseAnon();
  const { error: signInError } = await anon.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password: currentPassword,
  });

  if (signInError) {
    throw new Error('INVALID_PASSWORD');
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin.auth.admin.updateUserById(userId, {
    password: newPassword,
  });

  if (error) {
    throw error;
  }
}

export async function getGoogleOAuthRedirectUrl(
  request: FastifyRequest,
  reply: FastifyReply,
  nextPath: string
): Promise<string> {
  if (useMemoryBackend()) {
    // eslint-disable-next-line no-console
    console.log(
      '[auth google] DEV — редирект на mock callback (без accounts.google.com)'
    );
    const params = new URLSearchParams({ memory: '1', next: nextPath });
    return `${getApiPublicUrl()}/api/auth/oauth/callback?${params.toString()}`;
  }

  const supabase = createOAuthSupabaseClient(request, reply);
  const redirectTo = `${getApiPublicUrl()}/api/auth/oauth/callback?next=${encodeURIComponent(nextPath)}`;

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

  return data.url;
}

export async function completeOAuthCallback(
  request: FastifyRequest,
  reply: FastifyReply,
  input: { code?: string; memory?: boolean }
): Promise<AuthSession> {
  if (useMemoryBackend() || input.memory) {
    return memory.memorySignInWithGoogle();
  }

  if (!input.code) {
    throw new Error('OAUTH_CODE_MISSING');
  }

  const supabase = createOAuthSupabaseClient(request, reply);
  const { data, error } = await supabase.auth.exchangeCodeForSession(input.code);
  clearOAuthCookies(request, reply);

  if (error || !data.session) {
    throw error ?? new Error('OAUTH_SESSION_MISSING');
  }

  const publicUser = await getPublicUserByAccessToken(data.session.access_token);
  if (!publicUser) {
    throw new Error('USER_PROFILE_MISSING');
  }

  // eslint-disable-next-line no-console
  console.log(
    `[auth google] Supabase OAuth complete — email=${publicUser.email}, userId=${publicUser.id}`
  );

  return mapSession(
    data.session.access_token,
    data.session.refresh_token,
    publicUser
  );
}
