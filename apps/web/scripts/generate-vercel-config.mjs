/**
 * Generates vercel.json with API proxy rewrites from TAROT_API_PROXY_URL.
 * Run before deploy (see apps/web package.json "prebuild").
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, '..');
const outPath = path.join(webRoot, 'vercel.json');

const apiBase = (process.env.TAROT_API_PROXY_URL || '').trim().replace(/\/$/, '');

const rewrites = [];

if (apiBase) {
  rewrites.push(
    {
      source: '/api/:path*',
      destination: `${apiBase}/api/:path*`,
    },
    {
      source: '/health',
      destination: `${apiBase}/health`,
    }
  );
  console.log(`[vercel] API proxy → ${apiBase}`);
} else {
  console.warn(
    '[vercel] TAROT_API_PROXY_URL is not set — /api will not be proxied. ' +
      'Set it in Vercel project env (URL of deployed apps/api, e.g. Render/Railway).'
  );
}

// SPA fallback (must be last — Vercel uses first match)
rewrites.push({
  source: '/:path*',
  destination: '/index.html',
});

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
