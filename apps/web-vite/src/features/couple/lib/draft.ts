import type { TCoupleNames } from '@legacy-data';

/**
 * Имена пары между экранами (форма «Расклада для парочки» → выбор карт).
 * sessionStorage переживает перезагрузку вкладки, но не утекает в другие сессии.
 */
const NAMES_KEY = 'mt.coupleNames.v1';
export const COUPLE_NAME_MAX = 24;
/** «Для влюблённых» стоит ⚡2 (сервер списывает 2 единицы, routes/interpret.ts). */
export const COUPLE_COST = 2;

export function loadCoupleNames(): TCoupleNames {
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(NAMES_KEY) ?? 'null') as Partial<TCoupleNames> | null;
    return {
      him: typeof parsed?.him === 'string' ? parsed.him.slice(0, COUPLE_NAME_MAX) : '',
      her: typeof parsed?.her === 'string' ? parsed.her.slice(0, COUPLE_NAME_MAX) : '',
    };
  } catch {
    return { him: '', her: '' };
  }
}

export function saveCoupleNames(names: TCoupleNames): void {
  try {
    window.sessionStorage.setItem(NAMES_KEY, JSON.stringify(names));
  } catch {
    /* приватный режим */
  }
}
