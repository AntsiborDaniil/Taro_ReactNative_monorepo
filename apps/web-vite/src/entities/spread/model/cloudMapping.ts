import { SpreadsCategory } from '@legacy-data';
import type { SpreadName, TSpread, TSpreadFollowUp, TSpreadMemoryNote, TSpreadMemoryStats } from '@legacy-data';

/** Максимум уточнений на один расклад (совпадает с лимитом в readingResult). */
export const FOLLOW_UP_MAX = 3;

/** payload — opaque jsonb: чистим мусор и режем до FOLLOW_UP_MAX. */
export function normalizeFollowUps(value: unknown): TSpreadFollowUp[] {
  if (!Array.isArray(value)) return [];
  const result: TSpreadFollowUp[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const { q, a, createdAt } = item as Record<string, unknown>;
    if (typeof q !== 'string' || typeof a !== 'string' || !q.trim() || !a.trim()) continue;
    result.push(typeof createdAt === 'string' ? { q, a, createdAt } : { q, a });
    if (result.length >= FOLLOW_UP_MAX) break;
  }
  return result;
}

/** payload.memoryStats — opaque jsonb: принимаем, только если форма узнаваема. */
export function normalizeMemoryStats(value: unknown): TSpreadMemoryStats | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const v = value as Partial<TSpreadMemoryStats>;
  if (typeof v.spreadsCount !== 'number' || typeof v.cardsCount !== 'number') return undefined;
  return {
    spreadsCount: v.spreadsCount,
    cardsCount: v.cardsCount,
    topCards: Array.isArray(v.topCards) ? v.topCards.filter((c) => typeof c?.cardId === 'string') : [],
    dominantSuit: v.dominantSuit && typeof v.dominantSuit.suit === 'string' ? v.dominantSuit : null,
    reversedPct: typeof v.reversedPct === 'number' ? v.reversedPct : null,
    repeats: Array.isArray(v.repeats) ? v.repeats.filter((c) => typeof c?.cardId === 'string') : [],
  };
}

/** payload.memoryNote — opaque jsonb: принимаем только известные формы. */
export function normalizeMemoryNote(value: unknown): TSpreadMemoryNote | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const v = value as Record<string, unknown>;
  if (v.kind === 'card' && typeof v.cardId === 'string' && typeof v.date === 'string') {
    return { kind: 'card', cardId: v.cardId, date: v.date, spreadName: typeof v.spreadName === 'string' ? v.spreadName : '' };
  }
  if (v.kind === 'suit' && typeof v.suit === 'string' && typeof v.pct === 'number') {
    return { kind: 'suit', suit: v.suit, pct: v.pct };
  }
  return undefined;
}

/** Перенос apps/web/src/shared/api/cloud/spreadMapping.ts (1-в-1, без RN-типов). */
export const CLOUD_SPREAD_PACK_KEY = 'cloud';

export type CloudSpreadRecord = {
  id: string;
  userId: string;
  spreadKey: string;
  name: string;
  category: string | null;
  question: string | null;
  interpretation: string | null;
  cardsCount: number;
  packIndex: number;
  payload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type CreateSpreadBody = {
  spreadKey: string;
  name: string;
  category?: string | null;
  question?: string | null;
  interpretation?: string | null;
  cardsCount?: number;
  packIndex?: number;
  payload: Record<string, unknown>;
};

export function spreadToCloudBody(spread: TSpread): CreateSpreadBody {
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
      followUps: normalizeFollowUps(spread.followUps),
      memoryNote: spread.memoryNote ?? null,
      memoryStats: spread.memoryStats ?? null,
      mode: spread.mode ?? null,
      // shareQuestion: GET /spreads/shared/:id отдаёт вопрос только при true.
      shareQuestion: spread.shareQuestion === true,
    },
  };
}

export function cloudRecordToSpread(record: CloudSpreadRecord): TSpread {
  const payload = record.payload as Partial<TSpread>;

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
    followUps: normalizeFollowUps(payload.followUps),
    memoryNote: normalizeMemoryNote(payload.memoryNote),
    memoryStats: normalizeMemoryStats(payload.memoryStats),
    mode: payload.mode === 'deep' ? 'deep' : undefined,
    shareQuestion: payload.shareQuestion === true ? true : undefined,
  };
}

export function isCloudSpread(spread: TSpread): boolean {
  return spread.packKey === CLOUD_SPREAD_PACK_KEY && !!spread.uid;
}
