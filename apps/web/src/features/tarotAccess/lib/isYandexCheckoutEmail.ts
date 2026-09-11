/** Yandex Mail only — Lava checkout historically rejects other domains. */
const YANDEX_EMAIL_RE = /^[a-z0-9._%+-]+@(yandex\.(ru|com|by|kz|ua)|ya\.ru)$/i;

export function isYandexCheckoutEmail(email: string): boolean {
  return YANDEX_EMAIL_RE.test(email.trim().toLowerCase());
}

/** Alias used by the buy modal. */
export function isCheckoutEmail(email: string): boolean {
  return isYandexCheckoutEmail(email);
}
