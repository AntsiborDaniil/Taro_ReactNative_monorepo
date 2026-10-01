import { SpreadName, TarotCardDirection, tarotCards, type TSelectedTarotCard, type TTarotCard } from '@legacy-data';

/**
 * Перенос 1-в-1 apps/web/src/shared/lib/tarotCardReadings/getTarotCardReadings.ts
 * и apps/web/src/entities/Spread/lib/getRandomCardId.ts. `card.meaning/advice/
 * description/keywords/yesNo` в cardsData.ts — это i18n-ключи (namespace `card`,
 * см. ensureI18nNamespaces(['card']) в @pages/cardDetail), не готовый текст —
 * переводятся на рендере через t().
 */
export const DIRECTIONS: TarotCardDirection[] = [
  TarotCardDirection.Upright,
  TarotCardDirection.Upright,
  TarotCardDirection.Upright,
  TarotCardDirection.Reversed,
];

function getRandomElementFromArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const RANDOM_CARD_KEYS = ['advice', 'description', 'meaning', 'keywords', 'yesNo'] as const;
const SIMPLE_SPREADS = [SpreadName.Simple_YesNo, SpreadName.Simple_DaySuggest];

export function getRandomCardId(selectedCardsIds: Record<string, boolean>): number {
  const allCards = Array.from({ length: 78 }, (_, i) => i);
  const availableCards = allCards.filter((id) => !selectedCardsIds[id.toString()]);
  const randomIndex = Math.floor(Math.random() * availableCards.length);
  return availableCards[randomIndex];
}

export function getTarotCardReadings({
  card,
  spreadId = SpreadName.Default,
  index = 0,
  direction,
  keys = RANDOM_CARD_KEYS as unknown as (keyof TTarotCard)[],
}: {
  card: TTarotCard;
  spreadId?: SpreadName | null;
  index?: number;
  direction?: TarotCardDirection;
  keys?: (keyof TTarotCard)[];
}): TSelectedTarotCard {
  const selectedDirection = direction || getRandomElementFromArray(DIRECTIONS);

  const randomTexts = keys.reduce(
    (acc: Record<string, string>, currentValue) => {
      const firstLevelSelect = (card as Record<string, unknown>)[currentValue as string] as
        | Record<string, unknown>
        | undefined;
      const directional = firstLevelSelect?.[selectedDirection];

      if (currentValue === 'yesNo') {
        return { ...acc, yesNo: `card:${card.id}.yesNo.${selectedDirection}.0` };
      }

      if (Array.isArray(directional)) {
        return { ...acc, [currentValue as string]: directional[0] ?? '' };
      }

      if (typeof directional === 'string') {
        return { ...acc, [currentValue as string]: directional };
      }

      const bySpread = (directional as Record<string, unknown[]> | undefined)?.[spreadId ?? SpreadName.Default];
      if (bySpread) {
        const isSimple = spreadId != null && SIMPLE_SPREADS.includes(spreadId);
        const selectedIndex = currentValue === 'advice' || isSimple ? 0 : index;
        return { ...acc, [currentValue as string]: (bySpread[selectedIndex] as string) ?? '' };
      }

      return acc;
    },
    { advice: '', description: '', keywords: '', meaning: '', yesNo: '' },
  );

  return {
    ...card,
    ...randomTexts,
    direction: selectedDirection,
  } as unknown as TSelectedTarotCard;
}

/** Случайная не выбранная карта колоды (0..77). */
export function pickRandomCard(selectedCardsIds: Record<string, boolean>): TTarotCard {
  return tarotCards[getRandomCardId(selectedCardsIds).toString()];
}
