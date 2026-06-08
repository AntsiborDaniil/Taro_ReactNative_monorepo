/**
 * Generates vercel.json with API proxy rewrites.
 * Uses TAROT_API_PROXY_URL when set; otherwise production Render default.
 * Run before deploy (see apps/web package.json "prebuild").
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, '..');
const outPath = path.join(webRoot, 'vercel.json');

const DEFAULT_API_BASE = 'https://taro-reactnative-monorepo.onrender.com';
const envBase = (process.env.TAROT_API_PROXY_URL || '').trim().replace(/\/$/, '');
const apiBase = envBase || DEFAULT_API_BASE;

// /api/auth/* → Vercel serverless (sets HttpOnly cookie on app domain). Other /api/* → BFF proxy.
const rewrites = [
  {
    source: '/api/((?!auth/).*)',
    destination: `${apiBase}/api/$1`,
  },
  {
    source: '/health',
    destination: `${apiBase}/health`,
  },
  // SPA fallback — exclude /locales/* so JSON is served as static files
  {
    source: '/((?!locales/).*)',
    destination: '/index.html',
  },
];

if (envBase) {
  console.log(`[vercel] API proxy → ${apiBase} (from TAROT_API_PROXY_URL)`);
} else {
  console.log(`[vercel] API proxy → ${apiBase} (default)`);
}
console.log('[vercel] Auth: serverless at api/auth/* (session cookie on app domain)');

const config = {
  outputDirectory: 'dist',
  rewrites,
  headers: [
    {
      source: '/locales/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=86400',
        },
      ],
    },
    {
      source: '/assets/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
    {
      source: '/(.*)',
      headers: [{ key: 'X-Content-Type-Options', value: 'nosniff' }],
    },
  ],
};

fs.writeFileSync(outPath, `${JSON.stringify(config, null, 2)}\n`);
console.log(`[vercel] Wrote ${outPath}`);
