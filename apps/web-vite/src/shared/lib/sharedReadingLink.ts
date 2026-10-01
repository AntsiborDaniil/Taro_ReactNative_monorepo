/**
 * Deep-link на расшаренную интерпретацию — как apps/web:
 * основная ссылка `t.me/<bot>?startapp=r_<hex32>` (Mini App),
 * приём понимает и startapp, и `?reading=<uuid>`.
 *
 * Telegram отдаёт параметр запуска тремя путями, и все три нужно читать:
 * `?tgWebAppStartParam=` в query, `#tgWebAppStartParam=` во фрагменте (так
 * открывают десктоп/веб-клиенты) и `WebApp.initDataUnsafe.start_param` — он
 * появляется только после загрузки telegram-web-app.js, поэтому есть
 * waitForIncomingSharedReadingId().
 */
const SHARE_PREFIX = 'r_';
const DEFAULT_BOT = 'MindFullTaro_bot';
const START_PARAM_KEYS = ['reading', 'tgWebAppStartParam', 'startapp'];
/** Сколько ждём мост Telegram, если ссылка открыта внутри Mini App. */
const BRIDGE_WAIT_MS = 2500;
const BRIDGE_POLL_MS = 100;

function getBotUsername(): string {
  const fromEnv = (import.meta.env.VITE_TELEGRAM_BOT_USERNAME as string | undefined)?.trim();
  return fromEnv || DEFAULT_BOT;
}

/** UUID → 32 hex для Telegram startapp (лимит 64 символа). */
export function encodeSharedReadingStartParam(spreadUid: string): string {
  const hex = spreadUid.replace(/-/g, '').toLowerCase();
  return `${SHARE_PREFIX}${hex}`;
}

/**
 * Ссылку можно построить только для облачного uid (UUID из /api/spreads):
 * локальные uid гостевой истории (`local-…`) в startapp не кодируются.
 */
export function isShareableReadingUid(uid: string | undefined | null): uid is string {
  return typeof uid === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(uid.trim());
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

/** `#tgWebAppData=…&tgWebAppStartParam=r_…` — фрагмент, которым Telegram открывает Mini App. */
function readFromHash(): string | null {
  const hash = window.location.hash.replace(/^#/, '');
  if (!hash || !hash.includes('=')) return null;
  try {
    const params = new URLSearchParams(hash);
    for (const key of START_PARAM_KEYS) {
      const value = params.get(key);
      if (value) return value;
    }
  } catch {
    // ignore
  }
  return null;
}

export function readIncomingSharedReadingId(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const url = new URL(window.location.href);
    for (const key of START_PARAM_KEYS) {
      const decoded = decodeSharedReadingParam(url.searchParams.get(key));
      if (decoded) return decoded;
    }
  } catch {
    // ignore
  }

  const fromHash = decodeSharedReadingParam(readFromHash());
  if (fromHash) return fromHash;

  const startParam = window.Telegram?.WebApp?.initDataUnsafe?.start_param;
  if (typeof startParam === 'string') {
    return decodeSharedReadingParam(startParam);
  }

  return null;
}

/** Похоже, что страницу открыл клиент Telegram (мост уже есть или вот-вот появится). */
function looksLikeTelegramLaunch(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(window.Telegram?.WebApp) || window.location.hash.includes('tgWebApp');
}

/**
 * В Mini App start_param появляется только после инициализации telegram-web-app.js,
 * а AppShell монтируется раньше — поэтому ждём мост, иначе ссылка «не работает».
 */
export async function waitForIncomingSharedReadingId(timeoutMs = BRIDGE_WAIT_MS): Promise<string | null> {
  const immediate = readIncomingSharedReadingId();
  if (immediate || !looksLikeTelegramLaunch()) return immediate;

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await new Promise((resolve) => window.setTimeout(resolve, BRIDGE_POLL_MS));
    const found = readIncomingSharedReadingId();
    if (found) return found;
  }
  return null;
}

export function clearIncomingSharedReadingFromUrl(): void {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    let changed = false;
    for (const key of START_PARAM_KEYS) {
      if (url.searchParams.has(key)) {
        url.searchParams.delete(key);
        changed = true;
      }
    }

    // Фрагмент `#tgWebAppData=…` не трогаем: его разбирает telegram-web-app.js
    // при инициализации моста, и без него ломается тихий вход по initData.
    if (changed) {
      window.history.replaceState({}, '', url.pathname + url.search + url.hash);
    }
  } catch {
    // ignore
  }
}
