import { SpreadName, TarotCardDirection, tarotCards, type TSpread } from '@legacy-data';
import { getTarotCardReadings } from './getTarotCardReadings';

/**
 * Бесплатные карты периода: дня, недели и месяца — по одной на период.
 * Период считается как на сервере — по Москве (Europe/Moscow): день с 00:00,
 * неделя с понедельника, месяц с 1-го. Сервер — источник истины (уникальная
 * запись на период); здесь только кэш готового результата в localStorage,
 * чтобы повторный тап открывал ту же карту без сети.
 */
export type FreePeriodKind = 'day' | 'week' | 'month';

const KIND_BY_SPREAD: Partial<Record<SpreadName, FreePeriodKind>> = {
  [SpreadName.Simple_DaySuggest]: 'day',
  [SpreadName.Period_WeekCard]: 'week',
  [SpreadName.Period_MonthCard]: 'month',
};

export const FREE_PERIOD_SPREAD_IDS = Object.keys(KIND_BY_SPREAD) as SpreadName[];

export function freePeriodKindOf(spreadId: string | undefined | null): FreePeriodKind | null {
  return spreadId ? (KIND_BY_SPREAD[spreadId as SpreadName] ?? null) : null;
}

/** Бесплатный расклад периода (без ⚡, без вопроса, одна карта). */
export function isFreePeriodSpread(spreadId: string | undefined | null): boolean {
  return freePeriodKindOf(spreadId) !== null;
}

function moscowDate(now: Date): { y: number; m: number; d: number; weekday: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Moscow',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return {
    y: Number(get('year')),
    m: Number(get('month')),
    d: Number(get('day')),
    weekday: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(get('weekday')),
  };
}

/** Начало текущего периода (YYYY-MM-DD) — тот же расчёт, что freePeriodCardService.periodStart. */
export function freePeriodStart(kind: FreePeriodKind, now = new Date()): string {
  const { y, m, d, weekday } = moscowDate(now);
  const day = kind === 'day' ? d : kind === 'week' ? d - weekday : 1;
  return new Date(Date.UTC(y, m - 1, day)).toISOString().slice(0, 10);
}

const PREFIX = 'freeCard:';
const LEGACY_DAY_PREFIX = 'dayCard:';

function keyFor(kind: FreePeriodKind): string {
  return `${PREFIX}${kind}:${freePeriodStart(kind)}`;
}

export function getFreePeriodCard(kind: FreePeriodKind): TSpread | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(keyFor(kind));
    if (!raw) return null;
    const spread = JSON.parse(raw) as TSpread;
    return spread?.interpretation?.trim() && spread.selectedCards?.length ? spread : null;
  } catch {
    return null;
  }
}

export function saveFreePeriodCard(kind: FreePeriodKind, spread: TSpread): void {
  if (typeof window === 'undefined') return;
  try {
    // Чистим карты прошлых периодов этого типа (и старый формат dayCard:*).
    const current = keyFor(kind);
    for (let i = window.localStorage.length - 1; i >= 0; i -= 1) {
      const key = window.localStorage.key(i);
      if (!key) continue;
      if ((key.startsWith(`${PREFIX}${kind}:`) && key !== current) || key.startsWith(LEGACY_DAY_PREFIX)) {
        window.localStorage.removeItem(key);
      }
    }
    window.localStorage.setItem(current, JSON.stringify(spread));
  } catch {
    // ignore (quota/private mode)
  }
}

/** Карта дня — совместимость со старыми вызовами. */
export function getTodayDayCard(): TSpread | null {
  return getFreePeriodCard('day');
}

export function saveTodayDayCard(spread: TSpread): void {
  saveFreePeriodCard('day', spread);
}

/**
 * Карта периода уже открыта на сервере (другое устройство / очищен кэш) —
 * собираем расклад из сохранённого результата: та же карта и толкование.
 */
export function spreadFromSavedFreeCard(
  base: TSpread,
  saved: { interpretation: string; card: { card_id?: string; direction: string } },
): TSpread | null {
  const card = saved.card.card_id ? tarotCards[saved.card.card_id] : undefined;
  if (!card || !saved.interpretation?.trim()) return null;
  const direction = saved.card.direction === TarotCardDirection.Reversed ? TarotCardDirection.Reversed : TarotCardDirection.Upright;
  return {
    ...base,
    selectedCards: [getTarotCardReadings({ card, spreadId: base.id, direction })],
    interpretation: saved.interpretation,
  };
}
