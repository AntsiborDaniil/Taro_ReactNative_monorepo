function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, '');
}

/** Public web app origin (OAuth return, email links). */
export function getPublicAppUrl(): string {
  const configured = process.env.WEB_APP_URL?.trim();
  if (configured) {
    return stripTrailingSlash(configured);
  }

  const corsFirst = process.env.CORS_ORIGIN?.split(',')[0]?.trim();
  if (corsFirst) {
    return stripTrailingSlash(corsFirst);
  }

  return 'http://localhost:8081';
}

/** This API as seen by the browser (OAuth redirect_uri host). */
export function getApiPublicUrl(): string {
  const configured = process.env.API_PUBLIC_URL?.trim();
  if (configured) {
    return stripTrailingSlash(configured);
  }

  const port = process.env.PORT?.trim() || '3002';
  return `http://127.0.0.1:${port}`;
}

/** Where the SPA lands after OAuth (web app reads ?auth= and opens account). */
export const OAUTH_SPA_RETURN_PATH = '/';

/** Prevent open redirects after OAuth. */
export function sanitizeOAuthNext(next: string | undefined): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return OAUTH_SPA_RETURN_PATH;
  }
  return next;
}
