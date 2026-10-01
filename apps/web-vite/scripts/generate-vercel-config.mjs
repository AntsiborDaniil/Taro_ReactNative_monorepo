/**
 * Generates vercel.json for the Vite web app (перенос apps/web/scripts/generate-vercel-config.mjs).
 * - /api/auth/*  → Vercel serverless в api/ (HttpOnly cookie на домене приложения)
 * - /api/*, /health → BFF на Render (TAROT_API_PROXY_URL или прод по умолчанию)
 * - /admin/*     → SPA админки (собирается в dist/admin)
 * - /legal/*     → статические юридические страницы (public/legal, для платёжных провайдеров)
 * - остальное    → index.html (react-router-dom, реальные URL)
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
  { source: '/api/((?!auth/).*)', destination: `${apiBase}/api/$1` },
  { source: '/health', destination: `${apiBase}/health` },
  { source: '/admin', destination: '/admin/index.html' },
  { source: '/admin/', destination: '/admin/index.html' },
  { source: '/admin/:path*', destination: '/admin/index.html' },
  { source: '/legal', destination: '/legal/index.html' },
  { source: '/legal/', destination: '/legal/index.html' },
  // SPA fallback — кроме API, статических legal/admin и файлов сборки.
  { source: '/((?!api/|legal|admin|assets/).*)', destination: '/index.html' },
];

console.log(`[vercel] API proxy → ${apiBase}${envBase ? ' (from TAROT_API_PROXY_URL)' : ' (default)'}`);
console.log('[vercel] Auth: serverless at api/auth/* (session cookie on app domain)');

const config = {
  outputDirectory: 'dist',
  rewrites,
  headers: [
    {
      // Vite кладёт сюда файлы с хешем в имени — кешируем навсегда.
      source: '/assets/(.*)',
      headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
    },
    {
      source: '/admin/:path*',
      headers: [
        { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        { key: 'X-Frame-Options', value: 'DENY' },
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
