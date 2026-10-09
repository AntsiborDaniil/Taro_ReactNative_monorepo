/**
 * Чистые правила «Расклада на двоих» и «Карты для друга»: лимиты, сроки,
 * валидация текстов. Без БД и сети — чтобы проверять юнит-тестами.
 */

export const HOUR_MS = 60 * 60 * 1000;
export const DAY_MS = 24 * HOUR_MS;

/** Приглашение в пару живёт 72 часа. */
export const PAIR_TTL_MS = 72 * HOUR_MS;
/** После того как партнёр вытянул карты, на решение «делиться / нет» даём минимум столько. */
export const PAIR_CONSENT_GRACE_MS = 24 * HOUR_MS;
/** Ссылка на подарок живёт 30 дней. */
export const GIFT_TTL_MS = 30 * DAY_MS;

/** Цена пары в зарядах (⚡); первая пара на аккаунт бесплатна. */
export const PAIR_COST = 2;
export const PAIR_CARDS = 3;
export const PAIR_MAX_ACTIVE = 3;
export const PAIR_MAX_CREATED_PER_DAY = 10;
export const PAIR_MAX_JOINS_PER_DAY = 5;
/** Карта для друга стоит ⚡1; лимит в сутки — только защита от спама. */
export const GIFT_COST = 1;
export const GIFT_MAX_PER_DAY = 10;

export const NAME_MAX = 24;
export const NOTE_MAX = 140;
export const PAIR_QUESTION_MAX = 280;

export const GIFT_OCCASIONS = ['support', 'birthday', 'important_day', 'just_because'] as const;
export type GiftOccasion = (typeof GIFT_OCCASIONS)[number];

export type PairStatus = 'waiting' | 'drawn' | 'shared' | 'declined' | 'revoked' | 'expired';

/** Ждёт ли приглашение действий сторон (то есть может истечь). */
export function isPairOpenStatus(status: string): boolean {
  return status === 'waiting' || status === 'drawn';
}

/** Приглашение просрочено: ещё «открыто» по статусу, но срок вышел. */
export function isPairExpired(
  row: { status: string; expires_at: string },
  now: number = Date.now(),
): boolean {
  return isPairOpenStatus(row.status) && new Date(row.expires_at).getTime() <= now;
}

/**
 * Срок после того, как партнёр вытянул карты: не раньше прежнего срока
 * и не раньше, чем через сутки (время на согласие).
 */
export function expiresAfterPartnerDraw(currentExpiresAt: string, now: number = Date.now()): string {
  const current = new Date(currentExpiresAt).getTime();
  return new Date(Math.max(current, now + PAIR_CONSENT_GRACE_MS)).toISOString();
}

/** Нужно ли вернуть автору ⚡ / бесплатность: просрочено и ещё не возвращали. */
export function needsExpiryRefund(
  row: { status: string; expires_at: string; refunded: boolean },
  now: number = Date.now(),
): boolean {
  return !row.refunded && isPairExpired(row, now);
}

const LINK_RE =
  /(https?:\/\/|www\.|\bt\.me\b|\btelegram\.me\b|\b[a-z0-9-]+\.(?:com|ru|org|net|io|me|ly|app|xyz|su|info|bio|cc|to|gg|рф)\b)/i;

/** Ссылки, @-упоминания и угловые скобки в коротких пользовательских текстах недопустимы. */
export function containsLinkOrMention(text: string): boolean {
  return LINK_RE.test(text) || text.includes('@') || /[<>]/.test(text);
}

function normalizeSpaces(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, ' ').replace(/[ \t]+/g, ' ').trim();
}

export type TextCheck = { ok: true; value: string } | { ok: false; code: 'too_long' | 'link_or_mention' };

/** Имя на приглашении / получателя: ≤24 символов, без ссылок и @. Пустое — допустимо. */
export function sanitizeShortName(raw: unknown): TextCheck {
  const value = normalizeSpaces(typeof raw === 'string' ? raw : '').replace(/\n+/g, ' ');
  if ([...value].length > NAME_MAX) return { ok: false, code: 'too_long' };
  if (value && containsLinkOrMention(value)) return { ok: false, code: 'link_or_mention' };
  return { ok: true, value };
}

/** Записка к подарку: ≤140 символов, без ссылок и @. Пустая — допустима. */
export function sanitizeGiftNote(raw: unknown): TextCheck {
  const value = normalizeSpaces(typeof raw === 'string' ? raw : '');
  if ([...value].length > NOTE_MAX) return { ok: false, code: 'too_long' };
  if (value && containsLinkOrMention(value)) return { ok: false, code: 'link_or_mention' };
  return { ok: true, value };
}

export function isGiftOccasion(value: unknown): value is GiftOccasion {
  return typeof value === 'string' && (GIFT_OCCASIONS as readonly string[]).includes(value);
}

/** Окно «в сутки» — скользящие 24 часа. */
export function dayAgoIso(now: number = Date.now()): string {
  return new Date(now - DAY_MS).toISOString();
}

/** С кем расклад на двоих: пара, друзья, семья/близкие — меняет тон чтения и подписи в UI. */
export const PAIR_RELATIONS = ['partner', 'friend', 'family'] as const;
export type PairRelation = (typeof PAIR_RELATIONS)[number];

export function normalizePairRelation(value: unknown): PairRelation {
  return (PAIR_RELATIONS as readonly string[]).includes(String(value)) ? (value as PairRelation) : 'partner';
}
