import { createHash, randomUUID } from 'crypto';
import type { AuthPublicUser, AuthSession } from '../services/authService';
import type { SpreadRecord } from '../services/spreadsService';
import type { TarotDailyUsage } from '../services/tarotDailyUsageService';
import type { UserSettingsRecord } from '../services/userSettingsService';
import { logAuthEmail, logAuthGoogleDevSignIn, logAuthSignupComplete } from '../lib/authEmailLog';
import { devAuthRequireEmailVerify } from '../lib/devMode';
import { getTarotDailyLimit } from '../lib/env';

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

function hashPassword(password: string): string {
  return createHash('sha256').update(`taro-dev:${password}`).digest('hex');
}

function utcDay(): string {
  return new Date().toISOString().slice(0, 10);
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
  return issueSession(user);
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

export function memoryListSpreads(
  userId: string,
  options: { limit?: number; offset?: number } = {}
): SpreadRecord[] {
  const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);
  const offset = Math.max(options.offset ?? 0, 0);
  const list = spreadsByUser.get(userId) ?? [];
  return list.slice(offset, offset + limit);
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
