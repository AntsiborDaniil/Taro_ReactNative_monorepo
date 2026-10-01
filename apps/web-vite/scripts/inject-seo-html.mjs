/**
 * После vite build: подставляет абсолютные canonical и og:url в dist/index.html
 * (остальные SEO-мета уже в index.html). Адрес сайта — WEB_APP_URL, как в apps/web.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const indexPath = path.join(__dirname, '..', 'dist', 'index.html');

const SITE_URL = (
  process.env.WEB_APP_URL?.trim() ||
  process.env.VITE_WEB_APP_URL?.trim() ||
  'https://taro-react-native-monorepo.vercel.app'
).replace(/\/$/, '');

if (!fs.existsSync(indexPath)) {
  console.warn(`[seo] Skip: ${indexPath} not found (run vite build first)`);
  process.exit(0);
}

let html = fs.readFileSync(indexPath, 'utf8');
if (!html.includes('rel="canonical"')) {
  html = html.replace(
    '</head>',
    `    <link rel="canonical" href="${SITE_URL}/" />\n    <meta property="og:url" content="${SITE_URL}/" />\n  </head>`,
  );
}
fs.writeFileSync(indexPath, html);
console.log(`[seo] canonical/og:url → ${SITE_URL}/`);
