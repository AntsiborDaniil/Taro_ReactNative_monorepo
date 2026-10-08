/** Масти колоды (+ Старшие арканы как отдельная «масть») — общие для Зеркала и глубокого разбора. */
export type TarotSuitKey = 'major' | 'cups' | 'wands' | 'swords' | 'pentacles';

export const TAROT_SUITS: TarotSuitKey[] = ['major', 'cups', 'wands', 'swords', 'pentacles'];

/** Доля Старших арканов в колоде: 22 из 78. */
export const MAJOR_EXPECTED_SHARE = 22 / 78;

/**
 * Масть по числовому id карты (порядок в колоде: 0–21 Старшие, 22–35 Жезлы,
 * 36–49 Кубки, 50–63 Мечи, 64–77 Пентакли — сверено с cardsData тестом зеркала).
 */
export function suitOfCard(cardId: string): TarotSuitKey | null {
  const id = Number(cardId);
  if (!Number.isInteger(id) || id < 0 || id > 77) return null;
  if (id <= 21) return 'major';
  if (id <= 35) return 'wands';
  if (id <= 49) return 'cups';
  if (id <= 63) return 'swords';
  return 'pentacles';
}

export function emptySuitCounts(): Record<TarotSuitKey, number> {
  return { major: 0, cups: 0, wands: 0, swords: 0, pentacles: 0 };
}

/** Подсчёт мастей по картам (id). */
export function countSuits(cardIds: string[]): Record<TarotSuitKey, number> {
  const counts = emptySuitCounts();
  for (const id of cardIds) {
    const suit = suitOfCard(id);
    if (suit) counts[suit] += 1;
  }
  return counts;
}
