/** Emails Lava checkout accepts in our product (Yandex only). */
const YANDEX_DOMAINS = new Set([
  'yandex.ru',
  'yandex.com',
  'yandex.by',
  'yandex.kz',
  'yandex.ua',
  'ya.ru',
]);

const BASIC_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isYandexCheckoutEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  if (!BASIC_EMAIL_RE.test(normalized)) {
    return false;
  }
  const domain = normalized.slice(normalized.lastIndexOf('@') + 1);
  return YANDEX_DOMAINS.has(domain);
}
