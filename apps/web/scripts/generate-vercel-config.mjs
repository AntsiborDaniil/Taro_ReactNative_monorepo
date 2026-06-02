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

const rewrites = [
  {
    source: '/api/:path*',
    destination: `${apiBase}/api/:path*`,
  },
  {
    source: '/health',
    destination: `${apiBase}/health`,
  },
  // SPA fallback (must be last — Vercel uses first match)
  {
    source: '/:path*',
    destination: '/index.html',
  },
];

if (envBase) {
  console.log(`[vercel] API proxy → ${apiBase} (from TAROT_API_PROXY_URL)`);
} else {
  console.log(`[vercel] API proxy → ${apiBase} (default)`);
}

const config = {
  outputDirectory: 'dist',
  rewrites,
  headers: [
    {
      source: '/(.*)',
      headers: [{ key: 'X-Content-Type-Options', value: 'nosniff' }],
    },
  ],
};

fs.writeFileSync(outPath, `${JSON.stringify(config, null, 2)}\n`);
console.log(`[vercel] Wrote ${outPath}`);
