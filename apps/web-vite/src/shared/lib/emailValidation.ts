/** Перенос apps/web/src/shared/lib/emailValidation.ts 1-в-1 (чистые функции, без RN). */
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GMAIL_DOMAIN_RE = /@(gmail|googlemail)\.com$/i;

export function isValidNonGmailEmail(value: string): boolean {
  const trimmed = value.trim();
  return EMAIL_RE.test(trimmed) && !GMAIL_DOMAIN_RE.test(trimmed);
}
