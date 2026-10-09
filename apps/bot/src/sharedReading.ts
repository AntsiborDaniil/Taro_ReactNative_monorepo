import { config } from './config';
import type { BotLang } from './lang';
import { webAppUrlWithLang } from './lang';

/**
 * Пейлоад шаринга расклада из Mini App: `r_` + 32 hex (UUID без дефисов).
 * Кодирование — apps/web-vite/src/shared/lib/sharedReadingLink.ts
 * (`encodeSharedReadingStartParam`), лимит Telegram на start/startapp — 64 символа.
 */
const SHARED_READING_PAYLOAD_RE = /^r_([a-f0-9]{32})$/i;

/** `r_<hex32>` → UUID расклада; всё остальное (в том числе `lava_*`) → null. */
export function parseSharedReadingStartPayload(payload: string): string | null {
  const match = payload.trim().match(SHARED_READING_PAYLOAD_RE);
  if (!match) {
    return null;
  }

  const hex = match[1].toLowerCase();
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join('-');
}

/**
 * Ссылка Mini App на конкретный расклад: `WEB_APP_URL?reading=<uuid>&lang=…`.
 * `reading` читает useSharedReadingDeepLink; `lang` — i18n в web-vite.
 */
export function buildSharedReadingWebAppUrl(
  readingUid: string,
  lang: BotLang = 'ru',
): string {
  const url = new URL(webAppUrlWithLang(config.webAppUrl, lang));
  url.searchParams.set('reading', readingUid);
  return url.toString();
}

/** Пейлоады «Расклада на двоих» и «Карты для друга»: `pair_<hex32>` / `gift_<hex32>` (UUID без дефисов). */
const TOGETHER_PAYLOAD_RE = /^(pair|gift)_([a-f0-9]{32})$/i;

export type TogetherStartPayload = { kind: 'pair' | 'gift'; id: string };

export function parseTogetherStartPayload(payload: string): TogetherStartPayload | null {
  const match = payload.trim().match(TOGETHER_PAYLOAD_RE);
  if (!match) {
    return null;
  }
  const hex = match[2].toLowerCase();
  const id = [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join('-');
  return { kind: match[1].toLowerCase() as 'pair' | 'gift', id };
}

/** Ссылка Mini App на страницу `/pair/<uuid>` или `/gift/<uuid>` (+ ?lang=). */
export function buildTogetherWebAppUrl(
  link: TogetherStartPayload,
  lang: BotLang = 'ru',
): string {
  const url = new URL(webAppUrlWithLang(config.webAppUrl, lang));
  url.pathname = `/${link.kind}/${link.id}`;
  return url.toString();
}
