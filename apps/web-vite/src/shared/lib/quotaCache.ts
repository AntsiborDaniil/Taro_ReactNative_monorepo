/**
 * Последняя известная квота (дневной слот + заряды) — чтобы бейдж зарядов в шапке
 * рисовался сразу, пока /api/auth/me ещё летит, а не появлялся рывком через
 * секунду. Источник истины всё равно /me: после ответа значение перезаписывается.
 * localStorage может быть недоступен (приватный режим, превью) — тогда кэша просто нет.
 */

const STORAGE_KEY = 'mt.quotaCache.v1';

export type CachedQuota = {
  tarotDaily: { used: number; limit: number; day: string } | null;
  spreadCredits: number;
};

function utcDay(): string {
  return new Date().toISOString().slice(0, 10);
}

export function readQuotaCache(): CachedQuota | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedQuota;
    if (typeof parsed?.spreadCredits !== 'number') return null;
    const daily = parsed.tarotDaily;
    // Дневной слот обновляется по UTC-суткам: вчерашний «used» сегодня уже 0.
    if (daily && daily.day !== utcDay()) {
      return { ...parsed, tarotDaily: { ...daily, used: 0, day: utcDay() } };
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeQuotaCache(value: CachedQuota): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // квота хранилища / приватный режим — не критично
  }
}

export function clearQuotaCache(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // см. выше
  }
}
