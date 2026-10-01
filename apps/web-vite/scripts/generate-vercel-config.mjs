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
  // SPA админки: не переписываем /admin/assets/* (статика Vite-сборки).
  { source: '/admin', destination: '/admin/index.html' },
  { source: '/admin/', destination: '/admin/index.html' },
  { source: '/admin/((?!assets/).*)', destination: '/admin/index.html' },
  { source: '/legal', destination: '/legal/index.html' },
  { source: '/legal/', destination: '/legal/index.html' },
  // SPA fallback — кроме API, статических legal/admin и файлов сборки.
  { source: '/((?!api/|legal|admin|assets/).*)', destination: '/index.html' },
];

// Same-origin API. Скрипт Telegram и Метрика — единственные чужие источники.
// frame-ancestors нужен, чтобы Mini App открывался во фрейме Telegram.
// X-Frame-Options на само приложение не ставим: он перебивает frame-ancestors.
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' https://telegram.org https://mc.yandex.ru",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://mc.yandex.ru",
  "connect-src 'self' https://mc.yandex.ru https://mc.yandex.com",
  "frame-ancestors 'self' https://web.telegram.org https://*.telegram.org",
  "object-src 'none'",
  "base-uri 'self'",
].join('; ');

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
      // Как у apps/web: на админку CSP не вешаем (MUI/Emotion + RA).
      source: '/(.*)',
      headers: [{ key: 'X-Content-Type-Options', value: 'nosniff' }],
    },
    {
      source: '/((?!admin(?:/|$)).*)',
      headers: [{ key: 'Content-Security-Policy', value: contentSecurityPolicy }],
    },
  ],
};

fs.writeFileSync(outPath, `${JSON.stringify(config, null, 2)}\n`);
console.log(`[vercel] Wrote ${outPath}`);
