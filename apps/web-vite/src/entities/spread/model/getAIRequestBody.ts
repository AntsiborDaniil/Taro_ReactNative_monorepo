import type { TFunction } from 'i18next';
import type { TSpread } from './catalog';

export type TarotPosition = {
  label: string;
  card: string;
  direction: string;
  /** Метаданные карты: сервер по ним считает блок СТРУКТУРА и ПАМЯТЬ. */
  card_id?: string;
  arcana?: string;
  suit?: string | null;
};

/** Необязательный контекст для «памяти»: последнее настроение (≤3 дней) и активные привычки. */
export type InterpretContext = {
  mood?: { mood: number | null; energy: number | null; stress: number | null; date: string };
  habits?: string[];
};

export type TarotSpreadInput = {
  spread_type: string;
  language: string;
  question: string;
  positions: TarotPosition[];
  /** Каталожный id, напр. simple_daySuggest. */
  spread_key?: string;
  /** 'deep' — «Глубокий разбор» (⚡2), только для раскладов с 3+ картами. */
  mode?: 'deep';
  context?: InterpretContext;
  /** «Расклад для парочки»: имена пары. */
  couple?: { him: string; her: string };
};

/** Перенос 1-в-1 apps/web/src/entities/Spread/lib/getAIRequestBody.ts — тело POST /api/interpret. */
export function getAIRequestBody({
  spread,
  t,
  language,
  mode,
  context,
}: {
  spread: TSpread | null;
  t: TFunction;
  language: string;
  mode?: 'deep';
  context?: InterpretContext;
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
      card_id: item.id,
      arcana: item.arcana,
      suit: item.suit ?? null,
    })),
    ...(mode ? { mode } : {}),
    ...(context ? { context } : {}),
    ...(spread.couple ? { couple: spread.couple } : {}),
  };
}
