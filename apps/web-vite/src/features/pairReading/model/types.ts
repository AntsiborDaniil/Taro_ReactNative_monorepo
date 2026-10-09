/** Контракты API «Расклада на двоих» (apps/api/src/routes/pairs.ts). */

/** С кем расклад: пара, друг/подруга или близкий (семья). От связи зависят тексты и тон толкования. */
export const PAIR_RELATIONS = ['partner', 'friend', 'family'] as const;
export type PairRelation = (typeof PAIR_RELATIONS)[number];

export type PairCardDto = {
  card_id?: string;
  card: string;
  direction: string;
  label: string;
};

export type PairViewStatus = 'waiting' | 'drawn' | 'shared' | 'declined' | 'revoked' | 'expired' | 'taken';

/** Состояние пары глазами зрителя; приватные поля сервер не отдаёт (null). */
export type PairView = {
  id: string;
  role: 'author' | 'partner' | 'visitor';
  status: PairViewStatus;
  inviterName: string;
  question: string | null;
  showQuestion: boolean;
  relation: PairRelation;
  language: string;
  expiresAt: string;
  createdAt: string;
  cardsCount: number;
  authorCards: PairCardDto[] | null;
  partnerCards: PairCardDto[] | null;
  authorPersonal: string | null;
  partnerPersonal: string | null;
  pairInterpretation: string | null;
  partnerJoined: boolean;
  isFree: boolean | null;
  refunded: boolean | null;
  /** Сколько ⚡ списано при создании (0 — бесплатная пара); только автору. */
  charged: number | null;
};

export type PairQuota = {
  freeAvailable: boolean;
  cost: number;
  activeCount: number;
  /** Сколько ⚡ только что вернулось за истёкшие приглашения. */
  refundedCharges: number;
};

export type CreatePairBody = {
  question: string;
  showQuestion: boolean;
  inviterName: string;
  relation: PairRelation;
  language: string;
  cards: PairCardDto[];
};

export type CreatePairResponse = {
  id: string;
  personal: string;
  expiresAt: string;
  isFree: boolean;
};

export type PairErrorBody = { code?: string; message?: string };
