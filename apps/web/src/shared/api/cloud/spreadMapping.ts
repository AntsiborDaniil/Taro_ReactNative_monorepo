import {
  SpreadName,
  SpreadsCategory,
  SubscriptionType,
  TSpread,
  TSpreadCardCoords,
  TSpreadCardsOrder,
  TSelectedTarotCard,
} from 'shared/api';
import type { CloudSpreadRecord } from './types';

export const CLOUD_SPREAD_PACK_KEY = 'cloud';

type SpreadPayload = {
  description?: string;
  img?: string;
  selectedCards?: TSelectedTarotCard[];
  cardsPosition?: TSpreadCardCoords[];
  cardsOrder?: TSpreadCardsOrder[];
  horizontalPosition?: number[];
  availableSubscriptions?: SubscriptionType[];
};

export function spreadToCloudBody(spread: TSpread): {
  spreadKey: string;
  name: string;
  category?: string | null;
  question?: string | null;
  interpretation?: string | null;
  cardsCount?: number;
  packIndex?: number;
  payload: SpreadPayload;
} {
  return {
    spreadKey: spread.id,
    name: spread.name,
    category: spread.category ?? null,
    question: spread.question ?? '',
    interpretation: spread.interpretation ?? null,
    cardsCount: spread.cardsCount,
    packIndex: 0,
    payload: {
      description: spread.description,
      img: spread.img,
      selectedCards: spread.selectedCards,
      cardsPosition: spread.cardsPosition,
      cardsOrder: spread.cardsOrder,
      horizontalPosition: spread.horizontalPosition,
      availableSubscriptions: spread.availableSubscriptions,
    },
  };
}

export function cloudRecordToSpread(record: CloudSpreadRecord): TSpread {
  const payload = record.payload as SpreadPayload;

  return {
    name: record.name,
    id: record.spreadKey as SpreadName,
    description: payload.description ?? '',
    category: (record.category ?? '') as SpreadsCategory,
    img: payload.img ?? '',
    cardsCount: record.cardsCount,
    cardsPosition: payload.cardsPosition ?? [],
    selectedCards: payload.selectedCards ?? [],
    cardsOrder: payload.cardsOrder ?? [],
    availableSubscriptions: payload.availableSubscriptions ?? [],
    horizontalPosition: payload.horizontalPosition,
    date: record.createdAt,
    uid: record.id,
    packKey: CLOUD_SPREAD_PACK_KEY,
    question: record.question ?? undefined,
    interpretation: record.interpretation ?? undefined,
  };
}

export function isCloudSpread(spread: TSpread): boolean {
  return spread.packKey === CLOUD_SPREAD_PACK_KEY && !!spread.uid;
}
