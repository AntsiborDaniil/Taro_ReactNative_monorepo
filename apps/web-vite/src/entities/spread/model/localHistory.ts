import type { TSpread } from '@legacy-data';

/**
 * Перенос apps/web/src/entities/Spread/lib/spreadsHistory.ts (гостевая
 * ветка, localStorage вместо AsyncStorage — на web это тот же backing store)
 * — совместимые ключи `spreadsPack_<n>` / `lastSpreadsPackIndex`, пачки по 20
 * раскладов, новые сверху.
 */
const PACK_SIZE = 20;
const LAST_PACK_INDEX_KEY = 'lastSpreadsPackIndex';

function packKeyFor(index: number): string {
  return `spreadsPack_${index}`;
}

function readJson<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore (quota/private mode)
  }
}

export function getLastLocalPackIndex(): number {
  const raw = typeof window !== 'undefined' ? window.localStorage.getItem(LAST_PACK_INDEX_KEY) : null;
  return raw ? parseInt(raw, 10) || 0 : 0;
}

export function getLocalHistoryPack(packIndex: number): TSpread[] {
  return readJson<TSpread[]>(packKeyFor(packIndex)) ?? [];
}

function randomUid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Сохраняет расклад в текущую (или уже указанную у него) локальную пачку; обновляет, если uid уже там есть. */
export function saveSpreadLocally(spread: TSpread): TSpread {
  if (spread.uid && spread.packKey && spread.packKey !== 'cloud') {
    const pack = readJson<TSpread[]>(spread.packKey);
    if (pack) {
      const index = pack.findIndex((item) => item.uid === spread.uid);
      if (index >= 0) {
        pack[index] = spread;
        writeJson(spread.packKey, pack);
        return spread;
      }
    }
  }

  const lastIndex = getLastLocalPackIndex();
  let packKey = packKeyFor(lastIndex);
  let pack = readJson<TSpread[]>(packKey) ?? [];

  if (pack.length >= PACK_SIZE) {
    const newIndex = lastIndex + 1;
    packKey = packKeyFor(newIndex);
    pack = [];
    writeJson(LAST_PACK_INDEX_KEY, String(newIndex));
  }

  const saved: TSpread = { ...spread, uid: spread.uid ?? randomUid(), date: spread.date ?? new Date().toISOString(), packKey };
  pack.unshift(saved);
  writeJson(packKey, pack);
  return saved;
}
