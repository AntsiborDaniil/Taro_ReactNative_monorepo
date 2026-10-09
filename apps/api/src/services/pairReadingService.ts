import * as memory from '../dev/memoryBackend';
import { useMemoryBackend } from '../lib/devMode';
import { getSupabaseAdmin } from '../lib/supabase';
import { normalizePairRelation, type PairRelation,
  PAIR_CARDS,
  PAIR_COST,
  PAIR_MAX_ACTIVE,
  PAIR_MAX_CREATED_PER_DAY,
  PAIR_MAX_JOINS_PER_DAY,
  PAIR_TTL_MS,
  dayAgoIso,
  expiresAfterPartnerDraw,
  isPairExpired,
  type PairStatus,
} from '../lib/pairGiftRules';
import {
  generatePairInterpretation,
  generatePairPersonal,
} from './spreadInterpretationService';
import {
  getTelegramIdForUser,
  notifyUserSoft,
  toNotifyLang,
} from './userNotifyService';
import {
  refundSpreadSlot,
  tryConsumeSpreadSlots,
  type SpreadSlotSource,
} from './tarotDailyUsageService';

export type PairCard = { card_id?: string; card: string; direction: string; label: string };

/** Строка pair_readings (имена колонок БД). */
export type PairRow = {
  id: string;
  author_id: string;
  partner_id: string | null;
  question: string;
  show_question: boolean;
  inviter_name: string;
  /** partner | friend | family — с кем расклад. */
  relation: PairRelation;
  language: string;
  author_cards: PairCard[];
  partner_cards: PairCard[] | null;
  author_personal: string;
  partner_personal: string | null;
  pair_interpretation: string | null;
  status: PairStatus;
  is_free: boolean;
  charged: number;
  charge_sources: SpreadSlotSource[];
  refunded: boolean;
  joined_at: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
};

/** Условия атомарного обновления (UPDATE ... WHERE): вернёт null, если строка уже изменилась. */
export type PairGuard = {
  statusIn?: PairStatus[];
  partnerIsNull?: boolean;
  partnerIs?: string;
  /** expires_at > значения */
  notExpiredAt?: string;
  /** expires_at <= значения */
  expiredAt?: string;
};

export type PairCountFilter = {
  authorId?: string;
  partnerId?: string;
  statusIn?: PairStatus[];
  createdSince?: string;
  joinedSince?: string;
  notExpiredAt?: string;
};

// --- Репозиторий (Supabase / memory) ----------------------------------------

type QueryLike = {
  in: (col: string, values: string[]) => QueryLike;
  is: (col: string, value: null) => QueryLike;
  eq: (col: string, value: string) => QueryLike;
  gt: (col: string, value: string) => QueryLike;
  lte: (col: string, value: string) => QueryLike;
  gte: (col: string, value: string) => QueryLike;
};

function applyGuard<T>(query: T, guard: PairGuard): T {
  let q = query as unknown as QueryLike;
  if (guard.statusIn) q = q.in('status', guard.statusIn);
  if (guard.partnerIsNull) q = q.is('partner_id', null);
  if (guard.partnerIs) q = q.eq('partner_id', guard.partnerIs);
  if (guard.notExpiredAt) q = q.gt('expires_at', guard.notExpiredAt);
  if (guard.expiredAt) q = q.lte('expires_at', guard.expiredAt);
  return q as unknown as T;
}

async function insertPair(row: Omit<PairRow, 'id' | 'created_at' | 'updated_at'>): Promise<PairRow> {
  if (useMemoryBackend()) return memory.memoryInsertPair(row);
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.from('pair_readings').insert(row).select('*').single();
  if (error || !data) throw error ?? new Error('Could not create pair reading');
  return data as PairRow;
}

async function getPairRow(id: string): Promise<PairRow | null> {
  if (useMemoryBackend()) return memory.memoryGetPair(id);
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.from('pair_readings').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return (data as PairRow | null) ?? null;
}

async function updatePairGuarded(id: string, patch: Partial<PairRow>, guard: PairGuard): Promise<PairRow | null> {
  if (useMemoryBackend()) return memory.memoryUpdatePairGuarded(id, patch, guard);
  const admin = getSupabaseAdmin();
  const query = applyGuard(
    admin
      .from('pair_readings')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id),
    guard,
  );
  const { data, error } = await query.select('*').maybeSingle();
  if (error) throw error;
  return (data as PairRow | null) ?? null;
}

async function countPairs(filter: PairCountFilter): Promise<number> {
  if (useMemoryBackend()) return memory.memoryCountPairs(filter);
  const admin = getSupabaseAdmin();
  let q = admin.from('pair_readings').select('id', { count: 'exact', head: true });
  if (filter.authorId) q = q.eq('author_id', filter.authorId);
  if (filter.partnerId) q = q.eq('partner_id', filter.partnerId);
  if (filter.statusIn) q = q.in('status', filter.statusIn);
  if (filter.createdSince) q = q.gte('created_at', filter.createdSince);
  if (filter.joinedSince) q = q.gte('joined_at', filter.joinedSince);
  if (filter.notExpiredAt) q = q.gt('expires_at', filter.notExpiredAt);
  const { count, error } = await q;
  if (error) throw error;
  return count ?? 0;
}

async function hasFreePair(authorId: string): Promise<boolean> {
  if (useMemoryBackend()) return memory.memoryHasFreePair(authorId);
  const admin = getSupabaseAdmin();
  const { count, error } = await admin
    .from('pair_readings')
    .select('id', { count: 'exact', head: true })
    .eq('author_id', authorId)
    .eq('is_free', true);
  if (error) throw error;
  return (count ?? 0) > 0;
}

async function listExpiredOpenPairs(authorId: string, nowIso: string): Promise<PairRow[]> {
  if (useMemoryBackend()) return memory.memoryListExpiredOpenPairs(authorId, nowIso);
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('pair_readings')
    .select('*')
    .eq('author_id', authorId)
    .in('status', ['waiting', 'drawn'])
    .lte('expires_at', nowIso);
  if (error) throw error;
  return (data ?? []) as PairRow[];
}

// --- Ленивый возврат при истечении -------------------------------------------

/** Тексты уведомления автору, когда приглашение истекло без ответа. */
function expiredText(lang: 'ru' | 'en', charged: number, wasFree: boolean): string {
  if (lang === 'ru') {
    if (wasFree) return 'Партнёр не успел. Первый расклад на двоих снова бесплатный.';
    return charged > 0 ? `Партнёр не успел. ⚡${charged} вернулись на баланс.` : 'Партнёр не успел.';
  }
  if (wasFree) return 'Your partner ran out of time. Your first reading for two is free again.';
  return charged > 0 ? `Your partner ran out of time. ⚡${charged} returned to your balance.` : 'Your partner ran out of time.';
}

/**
 * Закрывает просроченные приглашения автора и возвращает ⚡ (или освобождает
 * бесплатную пару). Идемпотентно: статус 'expired' ставится условным UPDATE'ом,
 * поэтому возврат выполнит только один из параллельных запросов. Возврат ⚡
 * идёт после смены статуса: если он упадёт — ошибка логируется, повтора не будет
 * (лучше не вернуть, чем вернуть дважды).
 */
export async function settleExpiredPairs(authorId: string): Promise<{ settled: number; refundedCharges: number }> {
  const nowIso = new Date().toISOString();
  const rows = await listExpiredOpenPairs(authorId, nowIso);
  let settled = 0;
  let refundedCharges = 0;

  for (const row of rows) {
    const updated = await updatePairGuarded(
      row.id,
      {
        status: 'expired',
        refunded: true,
        // Бесплатная пара без ответа не «сгорает»: освобождаем флаг, первая пара снова доступна.
        is_free: false,
      },
      { statusIn: ['waiting', 'drawn'], expiredAt: nowIso },
    );
    if (!updated) continue;
    settled += 1;

    for (const source of row.charge_sources) {
      try {
        await refundSpreadSlot(authorId, source);
        refundedCharges += 1;
      } catch (error) {
        console.error('[pairs] expiry refund failed:', error);
      }
    }

    await notifyUserSoft({
      userId: authorId,
      text: expiredText(toNotifyLang(row.language), row.charged, row.is_free),
      path: `/pair/${row.id}`,
      lang: toNotifyLang(row.language),
      buttonText: toNotifyLang(row.language) === 'ru' ? 'Открыть' : 'Open',
    });
  }

  return { settled, refundedCharges };
}

// --- Квота -------------------------------------------------------------------

export async function getPairQuota(authorId: string): Promise<{
  freeAvailable: boolean;
  cost: number;
  activeCount: number;
  refundedCharges: number;
}> {
  const { refundedCharges } = await settleExpiredPairs(authorId);
  const [freeUsed, activeCount] = await Promise.all([
    hasFreePair(authorId),
    countPairs({ authorId, statusIn: ['waiting'], notExpiredAt: new Date().toISOString() }),
  ]);
  return { freeAvailable: !freeUsed, cost: PAIR_COST, activeCount, refundedCharges };
}

// --- Создание ----------------------------------------------------------------

export type CreatePairInput = {
  question: string;
  showQuestion: boolean;
  inviterName: string;
  relation: PairRelation;
  language: string;
  cards: PairCard[];
};

export type CreatePairResult =
  | {
      ok: true;
      row: PairRow;
      tarotDaily?: { used: number; limit: number; day: string };
      spreadCredits?: number;
    }
  | { ok: false; code: 'too_many_active' | 'daily_create_limit' }
  | {
      ok: false;
      code: 'daily_limit_reached';
      tarotDaily: { used: number; limit: number; day: string };
      spreadCredits: number;
    };

/**
 * Создание пары: лимиты → списание ⚡2 (если бесплатная пара уже использована) →
 * личное толкование автора → запись. Списание откатывается, если генерация или
 * запись упали. Исключения (OpenAI и т.п.) пробрасываются в роут.
 */
export async function createPairReading(authorId: string, input: CreatePairInput): Promise<CreatePairResult> {
  await settleExpiredPairs(authorId);

  const nowIso = new Date().toISOString();
  const [active, createdToday, freeUsed] = await Promise.all([
    countPairs({ authorId, statusIn: ['waiting'], notExpiredAt: nowIso }),
    countPairs({ authorId, createdSince: dayAgoIso() }),
    hasFreePair(authorId),
  ]);
  if (active >= PAIR_MAX_ACTIVE) return { ok: false, code: 'too_many_active' };
  if (createdToday >= PAIR_MAX_CREATED_PER_DAY) return { ok: false, code: 'daily_create_limit' };

  const isFree = !freeUsed;
  let sources: SpreadSlotSource[] = [];
  let quota: { used: number; limit: number; day: string; spreadCredits: number } | null = null;
  if (!isFree) {
    const slots = await tryConsumeSpreadSlots(authorId, PAIR_COST);
    if (!slots.ok) {
      return {
        ok: false,
        code: 'daily_limit_reached',
        tarotDaily: { used: slots.used, limit: slots.limit, day: slots.day },
        spreadCredits: slots.spreadCredits,
      };
    }
    sources = slots.sources;
    quota = { used: slots.used, limit: slots.limit, day: slots.day, spreadCredits: slots.spreadCredits };
  }

  const refundAll = async () => {
    for (const source of sources) {
      try {
        await refundSpreadSlot(authorId, source);
      } catch (error) {
        console.error('[pairs] create refund failed:', error);
      }
    }
  };

  try {
    const personal = await generatePairPersonal({
      language: input.language,
      question: input.question,
      relation: input.relation,
      cards: input.cards,
    });
    const row = await insertPair({
      author_id: authorId,
      partner_id: null,
      question: input.question,
      show_question: input.showQuestion,
      inviter_name: input.inviterName,
      relation: input.relation,
      language: input.language,
      author_cards: input.cards,
      partner_cards: null,
      author_personal: personal,
      partner_personal: null,
      pair_interpretation: null,
      status: 'waiting',
      is_free: isFree,
      charged: sources.length,
      charge_sources: sources,
      refunded: false,
      joined_at: null,
      expires_at: new Date(Date.now() + PAIR_TTL_MS).toISOString(),
    });
    return {
      ok: true,
      row,
      ...(quota
        ? {
            tarotDaily: { used: quota.used, limit: quota.limit, day: quota.day },
            spreadCredits: quota.spreadCredits,
          }
        : {}),
    };
  } catch (error) {
    await refundAll();
    throw error;
  }
}

// --- Просмотр ----------------------------------------------------------------

export type PairViewStatus = PairStatus | 'taken';

export type PairView = {
  id: string;
  role: 'author' | 'partner' | 'visitor';
  status: PairViewStatus;
  inviterName: string;
  relation: PairRelation;
  /** null — вопрос скрыт автором (или тема не задана). */
  question: string | null;
  showQuestion: boolean;
  language: string;
  expiresAt: string;
  createdAt: string;
  cardsCount: number;
  /** Автор — всегда; партнёр — только после согласия делиться. */
  authorCards: PairCard[] | null;
  /** Партнёр — всегда свои; автор — только если партнёр согласился. */
  partnerCards: PairCard[] | null;
  /** Только автору. */
  authorPersonal: string | null;
  /** Только партнёру (после отказа делиться). */
  partnerPersonal: string | null;
  pairInterpretation: string | null;
  /** Слот партнёра занят (для автора). */
  partnerJoined: boolean;
  /** Только автору. */
  isFree: boolean | null;
  refunded: boolean | null;
  /** Сколько ⚡ было списано при создании (0 — бесплатная пара); только автору. */
  charged: number | null;
};

/** Приватность: что видит конкретный зритель. user_id автора и партнёра наружу не отдаются. */
export function buildPairView(row: PairRow, viewerId: string | null, now: number = Date.now()): PairView {
  const role: PairView['role'] =
    viewerId && viewerId === row.author_id ? 'author' : viewerId && viewerId === row.partner_id ? 'partner' : 'visitor';
  const expired = isPairExpired(row, now);
  let status: PairViewStatus = expired ? 'expired' : row.status;
  // Чужой посетитель: слот уже занят кем-то другим.
  if (role === 'visitor' && !expired && row.partner_id && row.status !== 'revoked') status = 'taken';

  const shared = row.status === 'shared';
  const questionVisible = role === 'author' || row.show_question;

  return {
    id: row.id,
    role,
    status,
    inviterName: row.inviter_name,
    relation: normalizePairRelation(row.relation),
    question: questionVisible && row.question.trim() ? row.question : null,
    showQuestion: row.show_question,
    language: row.language,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    cardsCount: PAIR_CARDS,
    authorCards: role === 'author' || (role === 'partner' && shared) ? row.author_cards : null,
    partnerCards:
      role === 'partner' || (role === 'author' && shared) ? (row.partner_cards ?? null) : null,
    authorPersonal: role === 'author' ? row.author_personal : null,
    partnerPersonal: role === 'partner' && row.status === 'declined' ? row.partner_personal : null,
    pairInterpretation: shared && role !== 'visitor' ? row.pair_interpretation : null,
    partnerJoined: row.partner_id !== null,
    isFree: role === 'author' ? row.is_free : null,
    refunded: role === 'author' ? row.refunded : null,
    charged: role === 'author' ? row.charged : null,
  };
}

/** GET /pairs/:id. Для автора сначала лениво закрываются просроченные приглашения (возврат ⚡). */
export async function getPairViewFor(id: string, viewerId: string | null): Promise<PairView | null> {
  let row = await getPairRow(id);
  if (!row) return null;
  if (viewerId && viewerId === row.author_id && isPairExpired(row)) {
    await settleExpiredPairs(viewerId);
    row = (await getPairRow(id)) ?? row;
  }
  return buildPairView(row, viewerId);
}

// --- Вход партнёра -----------------------------------------------------------

export type JoinPairResult =
  | { ok: true; view: PairView }
  | {
      ok: false;
      code: 'not_found' | 'expired' | 'revoked' | 'taken' | 'own_invite' | 'partner_limit' | 'not_waiting';
    };

/**
 * Партнёр занимает слот («Вытянуть свои 3 карты»). Одноразово: первый вошедший
 * побеждает условным UPDATE (partner_id IS NULL). Автор ≠ партнёр по user_id и telegram_id.
 */
export async function joinPair(id: string, partnerId: string): Promise<JoinPairResult> {
  const row = await getPairRow(id);
  if (!row) return { ok: false, code: 'not_found' };
  if (row.author_id === partnerId) return { ok: false, code: 'own_invite' };

  const [authorTg, partnerTg] = await Promise.all([
    getTelegramIdForUser(row.author_id),
    getTelegramIdForUser(partnerId),
  ]);
  if (authorTg !== null && partnerTg !== null && authorTg === partnerTg) {
    return { ok: false, code: 'own_invite' };
  }

  if (row.status === 'revoked') return { ok: false, code: 'revoked' };
  if (isPairExpired(row) || row.status === 'expired') return { ok: false, code: 'expired' };
  // Повторный вход того же партнёра (перезагрузка страницы) — не ошибка.
  if (row.partner_id === partnerId) return { ok: true, view: buildPairView(row, partnerId) };
  if (row.partner_id) return { ok: false, code: 'taken' };
  if (row.status !== 'waiting') return { ok: false, code: 'not_waiting' };

  const joinsToday = await countPairs({ partnerId, joinedSince: dayAgoIso() });
  if (joinsToday >= PAIR_MAX_JOINS_PER_DAY) return { ok: false, code: 'partner_limit' };

  const nowIso = new Date().toISOString();
  const claimed = await updatePairGuarded(
    id,
    { partner_id: partnerId, joined_at: nowIso },
    { statusIn: ['waiting'], partnerIsNull: true, notExpiredAt: nowIso },
  );
  if (!claimed) {
    // Проиграли гонку или приглашение только что истекло/отозвано.
    const fresh = await getPairRow(id);
    if (fresh?.partner_id === partnerId) return { ok: true, view: buildPairView(fresh, partnerId) };
    return { ok: false, code: fresh && isPairExpired(fresh) ? 'expired' : fresh?.status === 'revoked' ? 'revoked' : 'taken' };
  }
  return { ok: true, view: buildPairView(claimed, partnerId) };
}

// --- Карты партнёра ----------------------------------------------------------

export type PartnerCardsResult =
  | { ok: true; view: PairView }
  | { ok: false; code: 'not_found' | 'forbidden' | 'invalid_state' | 'expired' };

export async function submitPartnerCards(id: string, partnerId: string, cards: PairCard[]): Promise<PartnerCardsResult> {
  const row = await getPairRow(id);
  if (!row) return { ok: false, code: 'not_found' };
  if (row.partner_id !== partnerId) return { ok: false, code: 'forbidden' };
  if (isPairExpired(row) || row.status === 'expired') return { ok: false, code: 'expired' };
  if (row.status !== 'waiting') return { ok: false, code: 'invalid_state' };

  const now = Date.now();
  const updated = await updatePairGuarded(
    id,
    {
      partner_cards: cards,
      status: 'drawn',
      // На решение «делиться или нет» остаётся минимум сутки.
      expires_at: expiresAfterPartnerDraw(row.expires_at, now),
    },
    { statusIn: ['waiting'], partnerIs: partnerId, notExpiredAt: new Date(now).toISOString() },
  );
  if (!updated) return { ok: false, code: 'invalid_state' };
  return { ok: true, view: buildPairView(updated, partnerId) };
}

// --- Согласие ----------------------------------------------------------------

export type ConsentResult =
  | { ok: true; view: PairView }
  | { ok: false; code: 'not_found' | 'forbidden' | 'invalid_state' | 'expired' };

function readyText(lang: 'ru' | 'en', partnerName: string): string {
  const name = partnerName.trim() || (lang === 'ru' ? 'Партнёр' : 'Your partner');
  return lang === 'ru'
    ? `${name} вытянул(а) свои карты. Ваш расклад на двоих готов.`
    : `${name} drew their cards. Your reading for two is ready.`;
}

function declinedText(lang: 'ru' | 'en'): string {
  return lang === 'ru'
    ? 'Партнёр вытянул карты, но решил оставить их при себе.'
    : 'Your partner drew their cards but chose to keep them private.';
}

/**
 * Партнёр решает: share=true → общее чтение пары (карты и текст увидит автор),
 * share=false → только короткое личное толкование партнёру. Автору уходит уведомление (soft-fail).
 * Генерация идёт до записи статуса: если модель упала, статус остаётся 'drawn' и можно повторить.
 */
export async function consentPair(
  id: string,
  partner: { id: string; name: string },
  share: boolean,
  language: string,
): Promise<ConsentResult> {
  const row = await getPairRow(id);
  if (!row) return { ok: false, code: 'not_found' };
  if (row.partner_id !== partner.id) return { ok: false, code: 'forbidden' };
  if (isPairExpired(row) || row.status === 'expired') return { ok: false, code: 'expired' };
  if (row.status !== 'drawn' || !row.partner_cards) return { ok: false, code: 'invalid_state' };

  let patch: Partial<PairRow>;
  if (share) {
    const text = await generatePairInterpretation({
      language: row.language,
      question: row.question,
      questionVisible: row.show_question,
      relation: normalizePairRelation(row.relation),
      authorCards: row.author_cards,
      partnerCards: row.partner_cards,
    });
    patch = { status: 'shared', pair_interpretation: text };
  } else {
    const personal = await generatePairPersonal({
      relation: normalizePairRelation(row.relation),
      language: language || row.language,
      // Вопрос партнёру — только если автор его раскрыл.
      question: row.show_question ? row.question : '',
      cards: row.partner_cards,
    });
    patch = { status: 'declined', partner_personal: personal };
  }

  const updated = await updatePairGuarded(id, patch, { statusIn: ['drawn'], partnerIs: partner.id });
  if (!updated) return { ok: false, code: 'invalid_state' };

  const lang = toNotifyLang(row.language);
  await notifyUserSoft({
    userId: row.author_id,
    text: share ? readyText(lang, partner.name) : declinedText(lang),
    path: `/pair/${id}`,
    lang,
    buttonText: lang === 'ru' ? 'Открыть' : 'Open',
  });

  return { ok: true, view: buildPairView(updated, partner.id) };
}

// --- Отзыв -------------------------------------------------------------------

export async function revokePair(
  id: string,
  authorId: string,
): Promise<{ ok: true; view: PairView } | { ok: false; code: 'not_found' | 'forbidden' | 'invalid_state' }> {
  const row = await getPairRow(id);
  if (!row) return { ok: false, code: 'not_found' };
  if (row.author_id !== authorId) return { ok: false, code: 'forbidden' };
  // Отзыв — пока партнёр не вытянул карты; ⚡ при отзыве не возвращаются (толкование автором получено).
  const updated = await updatePairGuarded(id, { status: 'revoked' }, { statusIn: ['waiting'] });
  if (!updated) return { ok: false, code: 'invalid_state' };
  return { ok: true, view: buildPairView(updated, authorId) };
}
