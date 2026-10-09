import { isTelegramMiniApp } from './web/telegramWebApp';

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

/**
 * Короткое имя Mini App из BotFather (`/newapp`). С ним ссылка
 * `t.me/<bot>/<app>?startapp=…` всегда открывает приложение; без него Telegram
 * открывает Mini App только если у бота настроен Main Mini App, иначе — чат бота.
 */
function getMiniAppShortName(): string {
  const fromEnv = (import.meta.env.VITE_TELEGRAM_MINI_APP_SHORT_NAME as string | undefined)?.trim();
  return fromEnv ? fromEnv.replace(/^\/+|\/+$/g, '') : '';
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

export type IncomingLinkKind = 'reading' | 'pair' | 'gift';
export type IncomingLink = { kind: IncomingLinkKind; id: string };

const PAIR_PREFIX = 'pair_';
const GIFT_PREFIX = 'gift_';

function hexToUuid(hex: string): string {
  const h = hex.toLowerCase();
  return [h.slice(0, 8), h.slice(8, 12), h.slice(12, 16), h.slice(16, 20), h.slice(20)].join('-');
}

/** UUID пары → `pair_<hex32>` для startapp. */
export function encodePairStartParam(pairId: string): string {
  return `${PAIR_PREFIX}${pairId.replace(/-/g, '').toLowerCase()}`;
}

/** UUID подарка → `gift_<hex32>` для startapp. */
export function encodeGiftStartParam(giftId: string): string {
  return `${GIFT_PREFIX}${giftId.replace(/-/g, '').toLowerCase()}`;
}

/**
 * Общий разбор параметра запуска: `r_<hex32>` (расклад), `pair_<hex32>` (пара),
 * `gift_<hex32>` (подарок); для раскладов дополнительно — «голый» UUID из `?reading=`.
 */
export function decodeStartParam(param: string | null | undefined): IncomingLink | null {
  if (!param) return null;
  const trimmed = param.trim();
  const pair = trimmed.match(new RegExp(`^${PAIR_PREFIX}([a-f0-9]{32})$`, 'i'));
  if (pair) return { kind: 'pair', id: hexToUuid(pair[1]) };
  const gift = trimmed.match(new RegExp(`^${GIFT_PREFIX}([a-f0-9]{32})$`, 'i'));
  if (gift) return { kind: 'gift', id: hexToUuid(gift[1]) };
  const reading = decodeSharedReadingParam(trimmed);
  return reading ? { kind: 'reading', id: reading } : null;
}

export function decodeSharedReadingParam(param: string | null | undefined): string | null {
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

/** Хэндл бота `@<bot>` — подпись внизу картинки для сторис. */
export function getBotHandle(): string {
  return `@${getBotUsername()}`;
}

/** Ссылка на бота. */
export function getBotUrl(): string {
  return `https://t.me/${getBotUsername()}`;
}

/** Путь страницы расшаренного расклада внутри SPA. */
export function sharedReadingPath(spreadUid: string): string {
  return `/r/${spreadUid.toLowerCase()}`;
}

/**
 * Веб-ссылка `${origin}/r/<id>` — открывается в обычном браузере без входа и без
 * Telegram (печатается на картинке для сторис, копируется кнопкой «Скопировать ссылку»).
 * Mini App отдаётся с того же origin, что и сайт, поэтому origin текущей страницы подходит.
 */
export function buildWebReadingUrl(spreadUid: string): string {
  return `${window.location.origin}${sharedReadingPath(spreadUid)}`;
}

/** Путь страницы пары / подарка внутри SPA. */
export function pairPath(pairId: string): string {
  return `/pair/${pairId.toLowerCase()}`;
}

export function giftPath(giftId: string): string {
  return `/gift/${giftId.toLowerCase()}`;
}

function buildMiniAppUrl(startapp: string): string {
  const bot = getBotUsername();
  const shortName = getMiniAppShortName();
  return shortName
    ? `https://t.me/${bot}/${shortName}?startapp=${startapp}`
    : `https://t.me/${bot}?startapp=${startapp}`;
}

/** Ссылка-приглашение в расклад на двоих: Mini App → t.me, веб → `${origin}/pair/<id>`. */
export function buildPairUrl(pairId: string): string {
  if (!isTelegramMiniApp() && typeof window !== 'undefined') {
    return `${window.location.origin}${pairPath(pairId)}`;
  }
  return buildMiniAppUrl(encodePairStartParam(pairId));
}

/** Ссылка на «Карту для друга»: Mini App → t.me, веб → `${origin}/gift/<id>`. */
export function buildGiftUrl(giftId: string): string {
  if (!isTelegramMiniApp() && typeof window !== 'undefined') {
    return `${window.location.origin}${giftPath(giftId)}`;
  }
  return buildMiniAppUrl(encodeGiftStartParam(giftId));
}

/**
 * Ссылка для шаринга. Внутри Mini App — Telegram deep link
 * (приоритет — прямая ссылка на приложение `t.me/<bot>/<app>?startapp=…`;
 * без VITE_TELEGRAM_MINI_APP_SHORT_NAME остаётся `t.me/<bot>?startapp=…`:
 * сработает при настроенном Main Mini App, иначе бот ответит кнопкой —
 * см. apps/bot/src/sharedReading.ts). Вне Telegram — веб-ссылка `${origin}/r/<id>`,
 * которая открывается в обычном браузере без входа.
 */
export function buildSharedReadingUrl(spreadUid: string): string {
  if (!isTelegramMiniApp() && typeof window !== 'undefined') {
    return buildWebReadingUrl(spreadUid);
  }
  const startapp = encodeSharedReadingStartParam(spreadUid);
  const bot = getBotUsername();
  const shortName = getMiniAppShortName();
  return shortName
    ? `https://t.me/${bot}/${shortName}?startapp=${startapp}`
    : `https://t.me/${bot}?startapp=${startapp}`;
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

/** Параметры запуска в порядке приоритета: query → фрагмент → initDataUnsafe.start_param. */
function readRawStartParams(): string[] {
  const out: string[] = [];
  if (typeof window === 'undefined') return out;

  try {
    const url = new URL(window.location.href);
    for (const key of START_PARAM_KEYS) {
      const value = url.searchParams.get(key);
      if (value) out.push(value);
    }
  } catch {
    // ignore
  }

  const fromHash = readFromHash();
  if (fromHash) out.push(fromHash);

  const startParam = window.Telegram?.WebApp?.initDataUnsafe?.start_param;
  if (typeof startParam === 'string' && startParam) out.push(startParam);

  return out;
}

/** Входящая ссылка любого вида (расклад / пара / подарок) или null. */
export function readIncomingLink(): IncomingLink | null {
  for (const raw of readRawStartParams()) {
    const decoded = decodeStartParam(raw);
    if (decoded) return decoded;
  }
  return null;
}

export function readIncomingSharedReadingId(): string | null {
  for (const raw of readRawStartParams()) {
    const decoded = decodeSharedReadingParam(raw);
    if (decoded) return decoded;
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

export async function waitForIncomingLink(timeoutMs = BRIDGE_WAIT_MS): Promise<IncomingLink | null> {
  const immediate = readIncomingLink();
  if (immediate || !looksLikeTelegramLaunch()) return immediate;

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await new Promise((resolve) => window.setTimeout(resolve, BRIDGE_POLL_MS));
    const found = readIncomingLink();
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
