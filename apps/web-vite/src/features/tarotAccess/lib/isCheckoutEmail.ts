/** Перенос 1-в-1 apps/web/src/features/tarotAccess/lib/isYandexCheckoutEmail.ts — Lava-чекаут принимает только Яндекс-почту. */
const YANDEX_EMAIL_RE = /^[a-z0-9._%+-]+@(yandex\.(ru|com|by|kz|ua)|ya\.ru)$/i;

export function isCheckoutEmail(email: string): boolean {
  return YANDEX_EMAIL_RE.test(email.trim().toLowerCase());
}
