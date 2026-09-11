import { Platform } from 'react-native';

const SHARE_PREFIX = 'r_';
const DEFAULT_BOT = 'MindFullTaro_bot';

function getBotUsername(): string {
  const fromEnv =
    typeof process !== 'undefined'
      ? process.env?.EXPO_PUBLIC_TELEGRAM_BOT_USERNAME?.trim()
      : undefined;
  return fromEnv || DEFAULT_BOT;
}

/** UUID → 32 hex chars for Telegram startapp (max 64). */
export function encodeSharedReadingStartParam(spreadUid: string): string {
  const hex = spreadUid.replace(/-/g, '').toLowerCase();
  return `${SHARE_PREFIX}${hex}`;
}

export function decodeSharedReadingStartParam(
  param: string | null | undefined
): string | null {
  if (!param) {
    return null;
  }
  const trimmed = param.trim();
  const match = trimmed.match(/^r_([a-f0-9]{32})$/i);
  if (!match) {
    // Also accept raw UUID from ?reading=
    const uuidMatch = trimmed.match(
      /^([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i
    );
    return uuidMatch ? uuidMatch[1].toLowerCase() : null;
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
 * Shareable link that opens the Mini App on the interpretation page.
 * Prefer Telegram deep link; fall back to web `?reading=` for browsers.
 */
export function buildSharedReadingUrl(spreadUid: string): string {
  const startapp = encodeSharedReadingStartParam(spreadUid);
  const bot = getBotUsername();
  const tgLink = `https://t.me/${bot}?startapp=${startapp}`;

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    // Outside Telegram clipboard still works with t.me; keep as primary.
    return tgLink;
  }

  return tgLink;
}

export function readIncomingSharedReadingId(): string | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return null;
  }

  try {
    const url = new URL(window.location.href);
    const fromQuery =
      url.searchParams.get('reading') ||
      url.searchParams.get('tgWebAppStartParam') ||
      url.searchParams.get('startapp');
    const fromQueryDecoded = decodeSharedReadingStartParam(fromQuery);
    if (fromQueryDecoded) {
      return fromQueryDecoded;
    }
  } catch {
    // ignore
  }

  const startParam = window.Telegram?.WebApp?.initDataUnsafe?.start_param;
  if (typeof startParam === 'string') {
    return decodeSharedReadingStartParam(startParam);
  }

  return null;
}

export function clearIncomingSharedReadingFromUrl(): void {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return;
  }
  try {
    const url = new URL(window.location.href);
    let changed = false;
    for (const key of ['reading', 'tgWebAppStartParam', 'startapp']) {
      if (url.searchParams.has(key)) {
        url.searchParams.delete(key);
        changed = true;
      }
    }
    if (changed) {
      window.history.replaceState({}, '', url.pathname + url.search + url.hash);
    }
  } catch {
    // ignore
  }
}
