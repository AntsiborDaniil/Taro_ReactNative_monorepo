/**
 * Injects SEO meta into dist/index.html after expo export (SPA crawlers read static HTML).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const indexPath = path.join(__dirname, '..', 'dist', 'index.html');

const SITE_URL =
  process.env.WEB_APP_URL?.trim() ||
  process.env.EXPO_PUBLIC_WEB_APP_URL?.trim() ||
  'https://taro-react-native-monorepo.vercel.app';

const SEO = {
  title: 'Mindful — Таро онлайн: расклады, карта дня, значения карт',
  description:
    'Онлайн-таро: расклады, карта дня, толкования карт и история гаданий. Бесплатно в тестовом режиме — войдите в аккаунт, чтобы сохранять расклады и избранное.',
  keywords:
    'таро, таро онлайн, расклад таро, гадание на таро, карты таро, карта дня таро, значение карт таро, tarot, tarot online, tarot reading, daily tarot card, tarot spreads, mindful tarot',
};

const metaBlock = `
    <script src="https://telegram.org/js/telegram-web-app.js" defer></script>
    <script>
      (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
      m[i].l=1*new Date();
      for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
      k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
      (window, document, "script", "https://mc.yandex.ru/metrika/tag.js?id=112263887", "ym");
      ym(112263887, "init", {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});
    </script>
    <noscript><div><img src="https://mc.yandex.ru/watch/112263887" style="position:absolute; left:-9999px;" alt="" /></div></noscript>
    <meta name="description" content="${SEO.description}" />
    <meta name="keywords" content="${SEO.keywords}" />
    <meta name="theme-color" content="#171F2C" />
    <meta name="robots" content="index, follow" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Mindful Tarot" />
    <meta property="og:title" content="${SEO.title}" />
    <meta property="og:description" content="${SEO.description}" />
    <meta property="og:url" content="${SITE_URL.replace(/\/$/, '')}/" />
    <meta property="og:locale" content="ru_RU" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${SEO.title}" />
    <meta name="twitter:description" content="${SEO.description}" />
    <link rel="canonical" href="${SITE_URL.replace(/\/$/, '')}/" />
`;

if (!fs.existsSync(indexPath)) {
  console.warn(`[seo] Skip: ${indexPath} not found (run expo export first)`);
  process.exit(0);
}

let html = fs.readFileSync(indexPath, 'utf8');

html = html.replace(/<html lang="[^"]*">/, '<html lang="ru">');
html = html.replace(/<title>[^<]*<\/title>/, `<title>${SEO.title}</title>`);

const viewportMeta =
  '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />';
if (html.includes('name="viewport"')) {
  html = html.replace(
    /<meta[^>]*name="viewport"[^>]*>/i,
    viewportMeta
  );
} else {
  html = html.replace(/<head>/, `<head>\n    ${viewportMeta}`);
}

if (!html.includes('name="description"')) {
  html = html.replace(/<head>/, `<head>${metaBlock}`);
}

fs.writeFileSync(indexPath, html);
console.log(`[seo] Updated ${indexPath}`);

const publicDir = path.join(__dirname, '..', 'public');
const distDir = path.join(__dirname, '..', 'dist');
for (const file of ['robots.txt', 'sitemap.xml']) {
  const src = path.join(publicDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(distDir, file));
    console.log(`[seo] Copied public/${file} → dist/${file}`);
  }
}
