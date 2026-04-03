import type { TFunction } from 'i18next';
import { TSpread } from 'shared/api';

export interface TarotPosition {
  label: string;
  card: string;
  direction: string;
  description?: string;
}

export interface TarotSpreadInput {
  spread_type: string;
  language: string;
  question: string;
  positions: TarotPosition[];
}

export function getAIRequestBody({
  spread,
  t,
  language,
}: {
  spread: TSpread | null;
  t: TFunction<'translation', undefined>;
  language: string;
}): TarotSpreadInput | null {
  if (!spread) {
    return null;
  }

  return {
    spread_type: t(spread.name),
    language,
    question: spread.question ?? '',
    positions: spread.selectedCards.map((item, index) => ({
      label: spread.cardsOrder?.[index]?.meaning
        ? t(`spread:${spread.cardsOrder[index].meaning}`)
        : '',
      card: t(item.name),
      direction: item.direction,
    })),
  };
}
