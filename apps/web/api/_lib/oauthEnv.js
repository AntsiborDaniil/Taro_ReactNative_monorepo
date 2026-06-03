/** Vercel serverless OAuth — env (set in Vercel project settings). */

function stripTrailingSlash(url) {
  return url.replace(/\/$/, '');
}

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function getWebAppOrigin() {
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

function getSupabaseUrl() {
  return requireEnv('SUPABASE_URL');
}

function getSupabaseAnonKey() {
  return requireEnv('SUPABASE_ANON_KEY');
}

function getSupabaseServiceRoleKey() {
  return requireEnv('SUPABASE_SERVICE_ROLE_KEY');
}

function isProduction() {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
}

function sanitizeOAuthNext(next) {
  const raw = typeof next === 'string' ? next : '/';
  if (!raw.startsWith('/') || raw.startsWith('//')) {
    return '/';
  }
  return raw;
}

function oauthCallbackUrl(nextPath) {
  const base = getWebAppOrigin();
  return `${base}/api/auth/oauth/callback?next=${encodeURIComponent(nextPath)}`;
}

module.exports = {
  requireEnv,
  getWebAppOrigin,
  getSupabaseUrl,
  getSupabaseAnonKey,
  getSupabaseServiceRoleKey,
  isProduction,
  sanitizeOAuthNext,
  oauthCallbackUrl,
};
