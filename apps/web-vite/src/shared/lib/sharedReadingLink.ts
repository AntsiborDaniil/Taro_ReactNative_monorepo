/**
 * Deep-link на расшаренную интерпретацию — как apps/web:
 * основная ссылка `t.me/<bot>?startapp=r_<hex32>` (Mini App),
 * приём понимает и startapp, и `?reading=<uuid>`.
 */
const SHARE_PREFIX = 'r_';
const DEFAULT_BOT = 'MindFullTaro_bot';

function getBotUsername(): string {
  const fromEnv = (import.meta.env.VITE_TELEGRAM_BOT_USERNAME as string | undefined)?.trim();
  return fromEnv || DEFAULT_BOT;
}

/** UUID → 32 hex для Telegram startapp (лимит 64 символа). */
export function encodeSharedReadingStartParam(spreadUid: string): string {
  const hex = spreadUid.replace(/-/g, '').toLowerCase();
  return `${SHARE_PREFIX}${hex}`;
}

function decodeSharedReadingParam(param: string | null | undefined): string | null {
  if (!param) return null;
  const trimmed = param.trim();

  const hexMatch = trimmed.match(new RegExp(`^${SHARE_PREFIX}([a-f0-9]{32})$`, 'i'));
  if (hexMatch) {
    const hex = hexMatch[1].toLowerCase();
    return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].join('-');
  }

  const uuidMatch = trimmed.match(
    /^([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i,
  );
  return uuidMatch ? uuidMatch[1].toLowerCase() : null;
}

/** Ссылка для шаринга: Telegram Mini App deep link. */
export function buildSharedReadingUrl(spreadUid: string): string {
  const startapp = encodeSharedReadingStartParam(spreadUid);
  return `https://t.me/${getBotUsername()}?startapp=${startapp}`;
}

export function readIncomingSharedReadingId(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const url = new URL(window.location.href);
    const fromQuery =
      url.searchParams.get('reading') ||
      url.searchParams.get('tgWebAppStartParam') ||
      url.searchParams.get('startapp');
    const fromQueryDecoded = decodeSharedReadingParam(fromQuery);
    if (fromQueryDecoded) return fromQueryDecoded;
  } catch {
    // ignore
  }

  const startParam = window.Telegram?.WebApp?.initDataUnsafe?.start_param;
  if (typeof startParam === 'string') {
    return decodeSharedReadingParam(startParam);
  }

  return null;
}

export function clearIncomingSharedReadingFromUrl(): void {
  if (typeof window === 'undefined') return;
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
