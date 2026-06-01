const DEFAULT_CORS_ORIGINS = [
  'http://localhost:8081',
  'http://127.0.0.1:8081',
  'http://localhost:19006',
  'http://127.0.0.1:19006',
];

function parseCorsOrigins(): string[] {
  const raw = process.env.CORS_ORIGIN?.trim();
  if (!raw) {
    return DEFAULT_CORS_ORIGINS;
  }
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

function isVercelPreviewOrigin(origin: string): boolean {
  if (process.env.ALLOW_VERCEL_PREVIEW !== '1') {
    return false;
  }
  try {
    const { hostname, protocol } = new URL(origin);
    return protocol === 'https:' && hostname.endsWith('.vercel.app');
  } catch {
    return false;
  }
}

export function isCorsOriginAllowed(origin: string | undefined): boolean {
  if (!origin) {
    return true;
  }

  const allowed = parseCorsOrigins();
  if (allowed.includes(origin)) {
    return true;
  }

  return isVercelPreviewOrigin(origin);
}

export function getCorsOriginsList(): string[] {
  return parseCorsOrigins();
}
