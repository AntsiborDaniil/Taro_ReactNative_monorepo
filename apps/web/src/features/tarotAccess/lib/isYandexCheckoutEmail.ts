/** Basic email shape check for Lava checkout (any domain). */
const BASIC_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isCheckoutEmail(email: string): boolean {
  return BASIC_EMAIL_RE.test(email.trim().toLowerCase());
}

/** @deprecated Use isCheckoutEmail — Yandex-only restriction removed. */
export const isYandexCheckoutEmail = isCheckoutEmail;
