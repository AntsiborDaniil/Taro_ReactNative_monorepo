import { createHash, randomUUID } from 'crypto';
import type { AuthPublicUser, AuthSession } from '../services/authService';
import type { GiftRow } from '../services/giftCardService';
import type { PairCountFilter, PairGuard, PairRow } from '../services/pairReadingService';
import type { SpreadRecord } from '../services/spreadsService';
import type { TarotDailyUsage } from '../services/tarotDailyUsageService';
import type { UserSettingsRecord } from '../services/userSettingsService';
import { logAuthEmail, logAuthGoogleDevSignIn, logAuthSignupComplete } from '../lib/authEmailLog';
import { devAuthRequireEmailVerify } from '../lib/devMode';
import { getTarotDailyLimit } from '../lib/env';
import { tarotSlotDay } from '../lib/tarotSlotDay';

type DevUser = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
};

const usersByEmail = new Map<string, DevUser>();
const usersById = new Map<string, DevUser>();
const tokens = new Map<string, string>();

type PendingVerification = {
  name: string;
  email: string;
  passwordHash: string;
  code: string;
  expiresAt: number;
};

const pendingByEmail = new Map<string, PendingVerification>();

const VERIFICATION_TTL_MS = 15 * 60 * 1000;

function generateVerificationCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function logDevVerificationCode(email: string, code: string): void {
  logAuthEmail({
    to: email,
    kind: 'signup_confirmation',
    code,
    simulated: true,
  });
}

const spreadsByUser = new Map<string, SpreadRecord[]>();
const favoritesByUser = new Map<string, Set<string>>();
const settingsByUser = new Map<string, UserSettingsRecord>();
const dailyUsageByUserDay = new Map<string, number>();
const spreadCreditsByUser = new Map<string, number>();
const lavaCheckoutsByInvoice = new Map<
  string,
  {
    userId: string;
    credits: number;
    email: string;
    status: 'pending' | 'paid' | 'failed';
    returnPath: string | null;
    paidAt?: number;
  }
>();

/** telegram_id → userId для memory (после TG-логина). */
const userIdByTelegramId = new Map<number, string>();
const telegramIdByUserId = new Map<string, number>();

function hashPassword(password: string): string {
  return createHash('sha256').update(`taro-dev:${password}`).digest('hex');
}

/** День слота — сутки с 10:00 МСК, как public.tarot_slot_day(). */
function utcDay(): string {
  return tarotSlotDay();
}

function dailyKey(userId: string, day: string): string {
  return `${userId}:${day}`;
}

function toPublicUser(user: DevUser): AuthPublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
  };
}

function issueSession(user: DevUser): AuthSession {
  const token = randomUUID();
  const refreshToken = randomUUID();
  tokens.set(token, user.id);
  return {
    token,
    refreshToken,
    user: toPublicUser(user),
  };
}

export function memoryGetPublicUserByAccessToken(
  accessToken: string
): AuthPublicUser | null {
  const userId = tokens.get(accessToken);
  if (!userId) {
    return null;
  }
  const user = usersById.get(userId);
  return user ? toPublicUser(user) : null;
}

export type MemorySignUpResult =
  | { kind: 'session'; session: AuthSession }
  | { kind: 'emailVerification'; email: string; devVerificationCode: string };

function createVerifiedUser(input: {
  name: string;
  email: string;
  passwordHash: string;
}): DevUser {
  const user: DevUser = {
    id: randomUUID(),
    email: input.email,
    name: input.name,
    passwordHash: input.passwordHash,
    createdAt: new Date().toISOString(),
  };
  usersByEmail.set(input.email, user);
  usersById.set(user.id, user);
  return user;
}

export function memorySignUp(input: {
  name: string;
  email: string;
  password: string;
}): MemorySignUpResult {
  const email = input.email.trim().toLowerCase();
  if (usersByEmail.has(email)) {
    throw new Error('USER_ALREADY_EXISTS');
  }

  const name = input.name.trim();
  const passwordHash = hashPassword(input.password);
  const code = generateVerificationCode();

  logDevVerificationCode(email, code);

  if (!devAuthRequireEmailVerify()) {
    const user = createVerifiedUser({ name, email, passwordHash });
    logAuthSignupComplete(email, user.id);
    return { kind: 'session', session: issueSession(user) };
  }

  pendingByEmail.set(email, {
    name,
    email,
    passwordHash,
    code,
    expiresAt: Date.now() + VERIFICATION_TTL_MS,
  });

  return { kind: 'emailVerification', email, devVerificationCode: code };
}

export function memoryVerifyEmailOtp(input: {
  email: string;
  code: string;
}): AuthSession {
  const email = input.email.trim().toLowerCase();
  const pending = pendingByEmail.get(email);
  if (!pending) {
    throw new Error('INVALID_VERIFICATION_CODE');
  }
  if (Date.now() > pending.expiresAt) {
    pendingByEmail.delete(email);
    throw new Error('VERIFICATION_CODE_EXPIRED');
  }
  if (pending.code !== input.code.trim()) {
    throw new Error('INVALID_VERIFICATION_CODE');
  }

  pendingByEmail.delete(email);

  const user = createVerifiedUser({
    name: pending.name,
    email,
    passwordHash: pending.passwordHash,
  });
  logAuthSignupComplete(email, user.id);

  return issueSession(user);
}

export function memoryResendVerificationCode(email: string): string {
  const normalized = email.trim().toLowerCase();
  const pending = pendingByEmail.get(normalized);
  if (!pending) {
    throw new Error('VERIFICATION_NOT_PENDING');
  }

  const code = generateVerificationCode();
  pending.code = code;
  pending.expiresAt = Date.now() + VERIFICATION_TTL_MS;
  logAuthEmail({
    to: normalized,
    kind: 'signup_resend',
    code,
    simulated: true,
  });
  return code;
}

export function memorySignInWithGoogle(): AuthSession {
  const email = 'google.dev@local.dev';
  let user = usersByEmail.get(email);
  const isNew = !user;
  if (!user) {
    user = createVerifiedUser({
      name: 'Google (dev)',
      email,
      passwordHash: hashPassword(randomUUID()),
    });
    logAuthSignupComplete(email, user.id);
  }
  logAuthGoogleDevSignIn(email, user.id);
  if (isNew) {
    logAuthEmail({
      to: email,
      kind: 'signup_confirmation',
      simulated: true,
    });
  }
  return issueSession(user);
}

export const DEV_DEMO_EMAIL = 'demo@tarot.local';
export const DEV_DEMO_PASSWORD = 'demo';

/** Гарантирует demo-пользователя для локального UI walkthrough. */
export function memoryEnsureDemoUser(): DevUser {
  const email = DEV_DEMO_EMAIL;
  let user = usersByEmail.get(email);
  if (!user) {
    user = createVerifiedUser({
      name: 'Demo Tarot',
      email,
      passwordHash: hashPassword(DEV_DEMO_PASSWORD),
    });
    logAuthSignupComplete(email, user.id);
  }
  return user;
}

export function memoryQuickLogin(): AuthSession {
  const user = memoryEnsureDemoUser();
  return issueSession(user);
}

export function memorySignInWithTelegram(input: {
  telegramId: number;
  displayName: string;
}): AuthSession {
  const email = `tg${input.telegramId}@telegram.local.dev`;
  let user = usersByEmail.get(email);
  if (!user) {
    user = createVerifiedUser({
      name: input.displayName,
      email,
      passwordHash: hashPassword(`tg-dev:${input.telegramId}`),
    });
    logAuthSignupComplete(email, user.id);
  }
  userIdByTelegramId.set(input.telegramId, user.id);
  telegramIdByUserId.set(user.id, input.telegramId);
  return issueSession(user);
}

export function memoryGetTelegramId(userId: string): number | null {
  return telegramIdByUserId.get(userId) ?? null;
}

export function memorySignIn(input: {
  email: string;
  password: string;
}): AuthSession {
  const email = input.email.trim().toLowerCase();
  if (pendingByEmail.has(email)) {
    throw new Error('EMAIL_NOT_CONFIRMED');
  }
  const user = usersByEmail.get(email);
  if (!user || user.passwordHash !== hashPassword(input.password)) {
    throw new Error('INVALID_CREDENTIALS');
  }
  return issueSession(user);
}

export function memoryUpdateProfile(
  userId: string,
  updates: { name: string }
): AuthPublicUser | null {
  const user = usersById.get(userId);
  if (!user) {
    return null;
  }
  user.name = updates.name.trim();
  return toPublicUser(user);
}

export function memoryChangePassword(input: {
  userId: string;
  email: string;
  currentPassword: string;
  newPassword: string;
}): void {
  const email = input.email.trim().toLowerCase();
  const user = usersByEmail.get(email);
  if (!user || user.id !== input.userId) {
    throw new Error('INVALID_PASSWORD');
  }
  if (user.passwordHash !== hashPassword(input.currentPassword)) {
    throw new Error('INVALID_PASSWORD');
  }
  user.passwordHash = hashPassword(input.newPassword);
}

export function memoryGetTarotDailyUsage(userId: string): TarotDailyUsage {
  const day = utcDay();
  const limit = getTarotDailyLimit();
  const used = dailyUsageByUserDay.get(dailyKey(userId, day)) ?? 0;
  return { used, limit, day };
}

export function memoryTryConsumeTarotDailySlot(
  userId: string
):
  | { ok: true; used: number; limit: number; day: string }
  | { ok: false; used: number; limit: number; day: string } {
  const day = utcDay();
  const limit = getTarotDailyLimit();
  const key = dailyKey(userId, day);
  const used = dailyUsageByUserDay.get(key) ?? 0;

  if (used >= limit) {
    return { ok: false, used, limit, day };
  }

  const next = used + 1;
  dailyUsageByUserDay.set(key, next);
  return { ok: true, used: next, limit, day };
}

export function memoryRefundTarotDailySlot(userId: string): void {
  const day = utcDay();
  const key = dailyKey(userId, day);
  const used = dailyUsageByUserDay.get(key) ?? 0;
  dailyUsageByUserDay.set(key, Math.max(used - 1, 0));
}

export function memoryGetSpreadCredits(userId: string): number {
  return spreadCreditsByUser.get(userId) ?? 0;
}

export function memoryConsumeSpreadCredit(
  userId: string
): { ok: true; spreadCredits: number } | { ok: false; spreadCredits: number } {
  const current = spreadCreditsByUser.get(userId) ?? 0;
  if (current <= 0) {
    return { ok: false, spreadCredits: 0 };
  }
  const next = current - 1;
  spreadCreditsByUser.set(userId, next);
  return { ok: true, spreadCredits: next };
}

export function memoryRefundSpreadCredit(userId: string): number {
  const next = (spreadCreditsByUser.get(userId) ?? 0) + 1;
  spreadCreditsByUser.set(userId, next);
  return next;
}

export function memoryCreateLavaCheckout(input: {
  invoiceId: string;
  userId: string;
  credits: number;
  email: string;
  returnPath?: string | null;
}): void {
  lavaCheckoutsByInvoice.set(input.invoiceId, {
    userId: input.userId,
    credits: input.credits,
    email: input.email,
    status: 'pending',
    returnPath: input.returnPath ?? null,
  });
}

export function memoryFulfillLavaCheckout(input: {
  invoiceId: string;
  userId?: string | null;
  credits: number;
  email?: string;
}): {
  ok: true;
  spreadCredits: number;
  alreadyApplied: boolean;
  userId: string;
  creditsAdded: number;
  returnPath: string | null;
} {
  const existing = lavaCheckoutsByInvoice.get(input.invoiceId);
  if (existing?.status === 'paid') {
    return {
      ok: true,
      spreadCredits: memoryGetSpreadCredits(existing.userId),
      alreadyApplied: true,
      userId: existing.userId,
      creditsAdded: existing.credits,
      returnPath: existing.returnPath,
    };
  }

  if (existing?.status === 'pending') {
    existing.status = 'paid';
    existing.paidAt = Date.now();
    if (input.email) {
      existing.email = input.email;
    }
    const next =
      (spreadCreditsByUser.get(existing.userId) ?? 0) + existing.credits;
    spreadCreditsByUser.set(existing.userId, next);
    return {
      ok: true,
      spreadCredits: next,
      alreadyApplied: false,
      userId: existing.userId,
      creditsAdded: existing.credits,
      returnPath: existing.returnPath,
    };
  }

  const userId = input.userId?.trim();
  if (!userId) {
    throw new Error('USER_ID_REQUIRED');
  }

  lavaCheckoutsByInvoice.set(input.invoiceId, {
    userId,
    credits: input.credits,
    email: input.email ?? '',
    status: 'paid',
    returnPath: null,
    paidAt: Date.now(),
  });
  const next = (spreadCreditsByUser.get(userId) ?? 0) + input.credits;
  spreadCreditsByUser.set(userId, next);
  return {
    ok: true,
    spreadCredits: next,
    alreadyApplied: false,
    userId,
    creditsAdded: input.credits,
    returnPath: null,
  };
}

/** Последний оплаченный checkout пользователя по telegram_id (для bot ?start=lava_success). */
export function memoryGetLatestPaidReturnForTelegram(telegramId: number): {
  returnPath: string | null;
  spreadCredits: number;
} | null {
  const userId = userIdByTelegramId.get(telegramId);
  if (!userId) return null;

  let latest: { returnPath: string | null; paidAt: number } | null = null;
  for (const checkout of lavaCheckoutsByInvoice.values()) {
    if (checkout.userId !== userId || checkout.status !== 'paid') continue;
    const paidAt = checkout.paidAt ?? 0;
    if (!latest || paidAt >= latest.paidAt) {
      latest = { returnPath: checkout.returnPath, paidAt };
    }
  }
  if (!latest) return null;
  return {
    returnPath: latest.returnPath,
    spreadCredits: memoryGetSpreadCredits(userId),
  };
}

export function memoryListSpreads(
  userId: string,
  options: { limit?: number; offset?: number } = {}
): SpreadRecord[] {
  const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);
  const offset = Math.max(options.offset ?? 0, 0);
  const list = spreadsByUser.get(userId) ?? [];
  return list.slice(offset, offset + limit);
}

export function memoryListRecentSpreads(
  userId: string,
  days: number,
  limit: number
): SpreadRecord[] {
  const since = Date.now() - days * 24 * 60 * 60 * 1000;
  return (spreadsByUser.get(userId) ?? [])
    .filter((s) => new Date(s.createdAt).getTime() >= since)
    .slice(0, limit);
}

export function memoryCreateSpread(
  userId: string,
  input: {
    spreadKey: string;
    name: string;
    category?: string | null;
    question?: string | null;
    interpretation?: string | null;
    cardsCount?: number;
    packIndex?: number;
    payload: Record<string, unknown>;
  }
): SpreadRecord {
  const now = new Date().toISOString();
  const record: SpreadRecord = {
    id: randomUUID(),
    userId,
    spreadKey: input.spreadKey,
    name: input.name,
    category: input.category ?? null,
    question: input.question ?? '',
    interpretation: input.interpretation ?? null,
    cardsCount: input.cardsCount ?? 0,
    packIndex: input.packIndex ?? 0,
    payload: input.payload,
    createdAt: now,
    updatedAt: now,
  };

  const list = spreadsByUser.get(userId) ?? [];
  list.unshift(record);
  spreadsByUser.set(userId, list);
  return record;
}

export function memoryUpdateSpread(
  userId: string,
  spreadId: string,
  input: {
    interpretation?: string | null;
    payload?: Record<string, unknown>;
    question?: string | null;
  }
): SpreadRecord | null {
  const list = spreadsByUser.get(userId);
  if (!list) {
    return null;
  }

  const index = list.findIndex((s) => s.id === spreadId);
  if (index < 0) {
    return null;
  }

  const current = list[index];
  const updated: SpreadRecord = {
    ...current,
    interpretation:
      input.interpretation !== undefined
        ? input.interpretation
        : current.interpretation,
    question:
      input.question !== undefined ? input.question : current.question,
    payload: input.payload !== undefined ? input.payload : current.payload,
    updatedAt: new Date().toISOString(),
  };

  list[index] = updated;
  return updated;
}

export function memoryGetSpreadById(
  userId: string,
  spreadId: string
): SpreadRecord | null {
  const list = spreadsByUser.get(userId) ?? [];
  return list.find((s) => s.id === spreadId) ?? null;
}

/** Public shared reading — any saved spread with an interpretation. */
export function memoryGetSharedSpreadById(
  spreadId: string
): SpreadRecord | null {
  for (const list of spreadsByUser.values()) {
    const found = list.find((s) => s.id === spreadId);
    if (found?.interpretation?.trim()) {
      return found;
    }
  }
  return null;
}

export function memoryListFavoriteCardIds(userId: string): string[] {
  const set = favoritesByUser.get(userId);
  return set ? Array.from(set) : [];
}

export function memoryAddFavoriteCard(userId: string, cardId: string): void {
  let set = favoritesByUser.get(userId);
  if (!set) {
    set = new Set();
    favoritesByUser.set(userId, set);
  }
  set.add(cardId.trim());
}

export function memoryRemoveFavoriteCard(
  userId: string,
  cardId: string
): boolean {
  const set = favoritesByUser.get(userId);
  if (!set) {
    return false;
  }
  return set.delete(cardId.trim());
}

export function memoryGetUserSettings(userId: string): UserSettingsRecord {
  return (
    settingsByUser.get(userId) ?? {
      userId,
      settings: {},
      updatedAt: new Date().toISOString(),
    }
  );
}

export function memoryUpsertUserSettings(
  userId: string,
  settings: Record<string, unknown>
): UserSettingsRecord {
  const record: UserSettingsRecord = {
    userId,
    settings,
    updatedAt: new Date().toISOString(),
  };
  settingsByUser.set(userId, record);
  return record;
}

export function memoryPatchUserSettings(
  userId: string,
  patch: Record<string, unknown>
): UserSettingsRecord {
  const current = memoryGetUserSettings(userId);
  return memoryUpsertUserSettings(userId, { ...current.settings, ...patch });
}

// --- Цели недели: серверные отметки и награда (habitRewardService) ---------

/** userId → Set("habitId|day") */
const habitCheckinsByUser = new Map<string, Set<string>>();
/** userId → Set(weekStart) */
const habitWeekRewardsByUser = new Map<string, Set<string>>();

function daysInWeek(userId: string, weekStart: string): number {
  const start = new Date(`${weekStart}T00:00:00Z`).getTime();
  const end = start + 7 * 24 * 60 * 60 * 1000;
  const days = new Set<string>();
  for (const key of habitCheckinsByUser.get(userId) ?? []) {
    const day = key.split('|')[1];
    const time = new Date(`${day}T00:00:00Z`).getTime();
    if (time >= start && time < end) days.add(day);
  }
  return days.size;
}

export function memorySetHabitCheckin(userId: string, habitId: string, day: string, done: boolean): void {
  let set = habitCheckinsByUser.get(userId);
  if (!set) {
    set = new Set();
    habitCheckinsByUser.set(userId, set);
  }
  const key = `${habitId}|${day}`;
  if (done) set.add(key);
  else set.delete(key);
}

export function memoryGetHabitWeek(userId: string, weekStart: string): { daysWithCheckins: number; claimed: boolean } {
  return {
    daysWithCheckins: daysInWeek(userId, weekStart),
    claimed: habitWeekRewardsByUser.get(userId)?.has(weekStart) ?? false,
  };
}

export function memoryClaimHabitWeekReward(
  userId: string,
  weekStart: string,
  requiredDays: number,
  credits: number,
): { status: 'granted' | 'already' | 'not_enough_days'; spreadCredits: number; daysWithCheckins: number } {
  const days = daysInWeek(userId, weekStart);
  const claimed = habitWeekRewardsByUser.get(userId) ?? new Set<string>();
  if (claimed.has(weekStart)) {
    return { status: 'already', spreadCredits: memoryGetSpreadCredits(userId), daysWithCheckins: days };
  }
  if (days < requiredDays) {
    return { status: 'not_enough_days', spreadCredits: memoryGetSpreadCredits(userId), daysWithCheckins: days };
  }
  claimed.add(weekStart);
  habitWeekRewardsByUser.set(userId, claimed);
  const next = memoryGetSpreadCredits(userId) + credits;
  spreadCreditsByUser.set(userId, next);
  return { status: 'granted', spreadCredits: next, daysWithCheckins: days };
}

// --- Бесплатные карты периода (freePeriodCardService) ------------------------

type MemoryFreeCard = { payload: unknown | null; createdAt: number };
/** `${userId}|${kind}|${periodStart}` → карта */
const freePeriodCards = new Map<string, MemoryFreeCard>();

export function memoryClaimFreePeriodCard(
  userId: string,
  kind: string,
  periodStart: string,
  staleMs: number,
): { ok: true; periodStart: string } | { ok: false; periodStart: string; saved: any } {
  const key = `${userId}|${kind}|${periodStart}`;
  const existing = freePeriodCards.get(key);
  if (existing && (existing.payload || Date.now() - existing.createdAt <= staleMs)) {
    return { ok: false, periodStart, saved: existing.payload ?? null };
  }
  freePeriodCards.set(key, { payload: null, createdAt: Date.now() });
  return { ok: true, periodStart };
}

export function memoryCompleteFreePeriodCard(userId: string, kind: string, periodStart: string, payload: unknown): void {
  const key = `${userId}|${kind}|${periodStart}`;
  const existing = freePeriodCards.get(key);
  freePeriodCards.set(key, { payload, createdAt: existing?.createdAt ?? Date.now() });
}

export function memoryReleaseFreePeriodCard(userId: string, kind: string, periodStart: string): void {
  const key = `${userId}|${kind}|${periodStart}`;
  if (!freePeriodCards.get(key)?.payload) freePeriodCards.delete(key);
}

export function memoryListFreePeriodCards(userId: string): Array<{ kind: any; period_start: string; payload: any }> {
  const rows: Array<{ kind: any; period_start: string; payload: any }> = [];
  for (const [key, value] of freePeriodCards) {
    const [uid, kind, periodStart] = key.split('|');
    if (uid === userId) rows.push({ kind, period_start: periodStart, payload: value.payload });
  }
  return rows;
}

// --- «Первый раз бесплатно» (freeFirstService) --------------------------------

const freeFirstUses = new Set<string>();

export function memoryClaimFreeFirst(userId: string, feature: string): boolean {
  const key = `${userId}|${feature}`;
  if (freeFirstUses.has(key)) return false;
  freeFirstUses.add(key);
  return true;
}

export function memoryReleaseFreeFirst(userId: string, feature: string): void {
  freeFirstUses.delete(`${userId}|${feature}`);
}

export function memoryHasUsedFreeFirst(userId: string, feature: string): boolean {
  return freeFirstUses.has(`${userId}|${feature}`);
}

// --- Расклад на двоих (pairReadingService) и «Карта для друга» (giftCardService) --

const pairReadings = new Map<string, PairRow>();

function pairMatchesGuard(row: PairRow, guard: PairGuard): boolean {
  if (guard.statusIn && !guard.statusIn.includes(row.status)) return false;
  if (guard.partnerIsNull && row.partner_id !== null) return false;
  if (guard.partnerIs && row.partner_id !== guard.partnerIs) return false;
  if (guard.notExpiredAt && new Date(row.expires_at).getTime() <= new Date(guard.notExpiredAt).getTime()) return false;
  if (guard.expiredAt && new Date(row.expires_at).getTime() > new Date(guard.expiredAt).getTime()) return false;
  return true;
}

export function memoryInsertPair(row: Omit<PairRow, 'id' | 'created_at' | 'updated_at'>): PairRow {
  if (row.is_free) {
    for (const existing of pairReadings.values()) {
      if (existing.author_id === row.author_id && existing.is_free) {
        // Как уникальный индекс pair_readings_one_free_per_author в Postgres.
        throw Object.assign(new Error('duplicate key value violates unique constraint'), { code: '23505' });
      }
    }
  }
  const now = new Date().toISOString();
  const created: PairRow = { ...row, id: randomUUID(), created_at: now, updated_at: now };
  pairReadings.set(created.id, created);
  return { ...created };
}

export function memoryGetPair(id: string): PairRow | null {
  const row = pairReadings.get(id);
  return row ? { ...row } : null;
}

/** Условное обновление (атомарно в рамках одного тика): null — условие не выполнено. */
export function memoryUpdatePairGuarded(id: string, patch: Partial<PairRow>, guard: PairGuard): PairRow | null {
  const row = pairReadings.get(id);
  if (!row || !pairMatchesGuard(row, guard)) return null;
  const next: PairRow = { ...row, ...patch, updated_at: new Date().toISOString() };
  pairReadings.set(id, next);
  return { ...next };
}

export function memoryCountPairs(filter: PairCountFilter): number {
  let count = 0;
  for (const row of pairReadings.values()) {
    if (filter.authorId && row.author_id !== filter.authorId) continue;
    if (filter.partnerId && row.partner_id !== filter.partnerId) continue;
    if (filter.statusIn && !filter.statusIn.includes(row.status)) continue;
    if (filter.createdSince && row.created_at < filter.createdSince) continue;
    if (filter.joinedSince && (!row.joined_at || row.joined_at < filter.joinedSince)) continue;
    if (filter.notExpiredAt && new Date(row.expires_at).getTime() <= new Date(filter.notExpiredAt).getTime()) continue;
    count += 1;
  }
  return count;
}

export function memoryHasFreePair(authorId: string): boolean {
  for (const row of pairReadings.values()) {
    if (row.author_id === authorId && row.is_free) return true;
  }
  return false;
}

/** Просроченные (по сроку) открытые приглашения автора. */
export function memoryListExpiredOpenPairs(authorId: string, nowIso: string): PairRow[] {
  return [...pairReadings.values()]
    .filter(
      (row) =>
        row.author_id === authorId &&
        (row.status === 'waiting' || row.status === 'drawn') &&
        new Date(row.expires_at).getTime() <= new Date(nowIso).getTime(),
    )
    .map((row) => ({ ...row }));
}

const giftCards = new Map<string, GiftRow>();

export function memoryInsertGift(row: Omit<GiftRow, 'id' | 'created_at'>): GiftRow {
  const created: GiftRow = { ...row, id: randomUUID(), created_at: new Date().toISOString() };
  giftCards.set(created.id, created);
  return { ...created };
}

export function memoryGetGift(id: string): GiftRow | null {
  const row = giftCards.get(id);
  return row ? { ...row } : null;
}

/** Первое открытие: ставит opened_at только если он пуст; null — уже открывали. */
export function memoryMarkGiftOpened(id: string, nowIso: string): GiftRow | null {
  const row = giftCards.get(id);
  if (!row || row.opened_at) return null;
  const next = { ...row, opened_at: nowIso };
  giftCards.set(id, next);
  return { ...next };
}

export function memoryCountGiftsSince(senderId: string, sinceIso: string): number {
  let count = 0;
  for (const row of giftCards.values()) {
    if (row.sender_id === senderId && row.created_at >= sinceIso) count += 1;
  }
  return count;
}
