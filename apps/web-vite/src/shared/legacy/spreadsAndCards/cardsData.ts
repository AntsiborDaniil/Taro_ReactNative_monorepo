import { TarotCardArcana, TarotCardSuit, TTarotCard } from './types';
import { CARD_SHAPES, CARDS_BASE, KEY_OVERRIDES } from './cardsMeta';

export const ARCANAS_AND_SUITS_NAMES: Record<
  TarotCardArcana | TarotCardSuit,
  string
> = {
  [TarotCardArcana.Major]: 'characteristics:suit.major',
  [TarotCardArcana.Minor]: 'characteristics:suit.minor',
  [TarotCardSuit.Wands]: 'characteristics:suit.wands',
  [TarotCardSuit.Pentacles]: 'characteristics:suit.pentacles',
  [TarotCardSuit.Swords]: 'characteristics:suit.swords',
  [TarotCardSuit.Cups]: 'characteristics:suit.cups',
};

type KeyShape = Record<string, Record<string, number> | number>;

/** Ключи i18n `<prefix>.0 … <prefix>.(count-1)`. */
function keys(prefix: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => `${prefix}.${i}`);
}

/** Строит секцию карты (meaning/advice/keywords/description) по компактной форме. */
function buildSection(id: string, field: string, shape: KeyShape): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [direction, inner] of Object.entries(shape)) {
    const prefix = `card:${id}.${field}.${direction}`;
    if (typeof inner === 'number') {
      result[direction] = keys(prefix, inner);
    } else {
      const bySpread: Record<string, string[]> = {};
      for (const [spread, count] of Object.entries(inner)) {
        bySpread[spread] = keys(`${prefix}.${spread}`, count);
      }
      result[direction] = bySpread;
    }
  }
  return result;
}

/** Применяет дословные исключения из шаблона (путь вида 'meaning.upright.x.10'). */
function applyOverrides(card: Record<string, unknown>, overrides: Readonly<Record<string, string>>): void {
  for (const [path, value] of Object.entries(overrides)) {
    const parts = path.split('.');
    const index = Number(parts.pop());
    let node = card as Record<string, unknown>;
    for (const part of parts) node = node[part] as Record<string, unknown>;
    (node as unknown as string[])[index] = value;
  }
}

/**
 * Карты строятся из компактной таблицы cardsMeta.ts (раньше — ~1,9 МБ буквальных
 * строк ключей в бандле). Эквивалентность старому объекту проверяет
 * cardsData.equivalence.test.ts.
 */
function buildTarotCards(): Record<string, TTarotCard> {
  const cards: Record<string, TTarotCard> = {};
  for (const [scalars, [m, a, k, d]] of CARDS_BASE) {
    const id = String(scalars.id);
    const { element, astrology, images, numerology, ...head } = scalars;
    const card: Record<string, unknown> = {
      ...head,
      meaning: buildSection(id, 'meaning', CARD_SHAPES.meaning[m] as KeyShape),
      advice: buildSection(id, 'advice', CARD_SHAPES.advice[a] as KeyShape),
      keywords: buildSection(id, 'keywords', CARD_SHAPES.keywords[k] as KeyShape),
      description: buildSection(id, 'description', CARD_SHAPES.description[d] as KeyShape),
      element,
      astrology,
      images,
      numerology,
    };
    const overrides = KEY_OVERRIDES[id];
    if (overrides) applyOverrides(card, overrides);
    cards[id] = card as unknown as TTarotCard;
  }
  return cards;
}

export const tarotCards: Record<string, TTarotCard> = buildTarotCards();
