/** Default document meta for web (SEO + social previews). */

export const WEB_SEO = {
  siteName: 'Mindful Tarot',
  title: 'Mindful — Таро онлайн: расклады, карта дня, значения карт',
  description:
    'Онлайн-таро: расклады, карта дня, толкования карт и история гаданий. Бесплатно в тестовом режиме — войдите в аккаунт, чтобы сохранять расклады и избранное.',
  keywords: [
    'таро',
    'таро онлайн',
    'расклад таро',
    'гадание на таро',
    'карты таро',
    'карта дня таро',
    'значение карт таро',
    'таро бесплатно',
    'tarot',
    'tarot online',
    'tarot reading',
    'daily tarot card',
    'tarot spreads',
    'mindful tarot',
  ].join(', '),
  themeColor: '#171F2C',
  locale: 'ru_RU',
} as const;

function upsertMeta(
  attribute: 'name' | 'property',
  key: string,
  content: string
): void {
  if (typeof document === 'undefined') {
    return;
  }
  const selector = `meta[${attribute}="${key}"]`;
  let el = document.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attribute, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel: string, href: string): void {
  if (typeof document === 'undefined') {
    return;
  }
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/** Apply SEO tags in the browser (SPA). Build script mirrors these in index.html. */
export function setupWebDocumentMeta(origin?: string): void {
  if (typeof document === 'undefined') {
    return;
  }

  const base =
    origin ??
    (typeof window !== 'undefined' ? window.location.origin : '');
  const canonical = base ? `${base.replace(/\/$/, '')}/` : '/';

  document.documentElement.lang = 'ru';
  document.title = WEB_SEO.title;

  upsertMeta('name', 'description', WEB_SEO.description);
  upsertMeta('name', 'keywords', WEB_SEO.keywords);
  upsertMeta('name', 'theme-color', WEB_SEO.themeColor);
  upsertMeta('name', 'robots', 'index, follow');
  upsertMeta('name', 'application-name', WEB_SEO.siteName);

  upsertMeta('property', 'og:type', 'website');
  upsertMeta('property', 'og:site_name', WEB_SEO.siteName);
  upsertMeta('property', 'og:title', WEB_SEO.title);
  upsertMeta('property', 'og:description', WEB_SEO.description);
  upsertMeta('property', 'og:locale', WEB_SEO.locale);
  if (canonical.startsWith('http')) {
    upsertMeta('property', 'og:url', canonical);
  }

  upsertMeta('name', 'twitter:card', 'summary_large_image');
  upsertMeta('name', 'twitter:title', WEB_SEO.title);
  upsertMeta('name', 'twitter:description', WEB_SEO.description);

  if (canonical.startsWith('http')) {
    upsertLink('canonical', canonical);
  }
}
