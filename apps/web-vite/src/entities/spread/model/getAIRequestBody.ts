import type { TFunction } from 'i18next';
import type { TSpread } from './catalog';

export type TarotPosition = {
  label: string;
  card: string;
  direction: string;
};

export type TarotSpreadInput = {
  spread_type: string;
  language: string;
  question: string;
  positions: TarotPosition[];
  /** Каталожный id, напр. simple_daySuggest. */
  spread_key?: string;
};

/** Перенос 1-в-1 apps/web/src/entities/Spread/lib/getAIRequestBody.ts — тело POST /api/interpret. */
export function getAIRequestBody({
  spread,
  t,
  language,
}: {
  spread: TSpread | null;
  t: TFunction;
  language: string;
}): TarotSpreadInput | null {
  if (!spread) {
    return null;
  }

  return {
    spread_type: t(spread.name),
    language,
    question: spread.question ?? '',
    spread_key: spread.id,
    positions: spread.selectedCards.map((item, index) => ({
      label: spread.cardsOrder?.[index]?.meaning ? t(`spread:${spread.cardsOrder[index].meaning}`) : '',
      card: t(item.name),
      direction: item.direction,
    })),
  };
}
