/** Vercel serverless OAuth — env (set in Vercel project settings). */

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, '');
}

export function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export function getWebAppOrigin(): string {
  const configured = process.env.WEB_APP_URL?.trim();
  if (configured) {
    return stripTrailingSlash(configured);
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    return `https://${vercel.replace(/^https?:\/\//, '')}`;
  }
  return 'http://localhost:8081';
}

export function getSupabaseUrl(): string {
  return requireEnv('SUPABASE_URL');
}

export function getSupabaseAnonKey(): string {
  return requireEnv('SUPABASE_ANON_KEY');
}

export function getSupabaseServiceRoleKey(): string {
  return requireEnv('SUPABASE_SERVICE_ROLE_KEY');
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
}

export function sanitizeOAuthNext(next: unknown): string {
  const raw = typeof next === 'string' ? next : '/';
  if (!raw.startsWith('/') || raw.startsWith('//')) {
    return '/';
  }
  return raw;
}

export function oauthCallbackUrl(nextPath: string): string {
  const base = getWebAppOrigin();
  return `${base}/api/auth/oauth/callback?next=${encodeURIComponent(nextPath)}`;
}
