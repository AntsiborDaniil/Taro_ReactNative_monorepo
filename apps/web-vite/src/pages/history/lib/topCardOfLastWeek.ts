import type { TSpread } from '@entities/spread';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Самая частая карта за последние 7 дней (для тизера «Зеркала недели»).
 * Одиночные карты не считаются «частыми» — нужно минимум 2 появления.
 */
export function topCardOfLastWeek(spreads: TSpread[], now: number = Date.now()): { cardId: string; count: number } | null {
  const counts = new Map<string, number>();
  for (const spread of spreads) {
    if (!spread.date) continue;
    const time = new Date(spread.date).getTime();
    if (Number.isNaN(time) || now - time > WEEK_MS) continue;
    for (const card of spread.selectedCards ?? []) {
      counts.set(card.id, (counts.get(card.id) ?? 0) + 1);
    }
  }
  let best: { cardId: string; count: number } | null = null;
  for (const [cardId, count] of counts) {
    if (count >= 2 && (!best || count > best.count)) best = { cardId, count };
  }
  return best;
}
