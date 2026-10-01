/**
 * Перенос apps/web/src/shared/lib/web/sharedReadingLink.ts (без Platform.OS —
 * тут всегда web, и без Telegram startapp-кодирования: web-vite открывается
 * в обычном браузере, не Mini App). Совместимость со старым форматом ссылок
 * сохранена на приём: readIncomingSharedReadingId понимает и обычный uuid в
 * `?reading=`, и старый hex `r_<32hex>` (?reading=/?startapp=/?tgWebAppStartParam=),
 * который отдавали ссылки t.me из apps/web.
 */
const SHARE_PREFIX = 'r_';

function decodeSharedReadingParam(param: string | null | undefined): string | null {
  if (!param) return null;
  const trimmed = param.trim();

  const hexMatch = trimmed.match(new RegExp(`^${SHARE_PREFIX}([a-f0-9]{32})$`, 'i'));
  if (hexMatch) {
    const hex = hexMatch[1].toLowerCase();
    return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].join('-');
  }

  const uuidMatch = trimmed.match(/^([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i);
  return uuidMatch ? uuidMatch[1].toLowerCase() : null;
}

/** Ссылка на расшаренную интерпретацию — открывается в web-vite напрямую (?reading=uuid). */
export function buildSharedReadingUrl(spreadUid: string): string {
  if (typeof window === 'undefined') return '';
  const url = new URL(window.location.origin + '/');
  url.searchParams.set('reading', spreadUid);
  return url.toString();
}

export function readIncomingSharedReadingId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const url = new URL(window.location.href);
    const fromQuery =
      url.searchParams.get('reading') ||
      url.searchParams.get('tgWebAppStartParam') ||
      url.searchParams.get('startapp');
    return decodeSharedReadingParam(fromQuery);
  } catch {
    return null;
  }
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
