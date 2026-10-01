import { DEFAULT_SETTINGS } from '@entities/settings/model/constants';
import type { TSettings } from '@entities/settings/model/types';
import type { CloudSpreadRecord, CreateSpreadBody } from '@entities/spread/model/cloudMapping';
import type { AuthSessionUser, TarotDailyQuota } from '@entities/user/model/types';

/** Демо-сессия для локальных моков (VITE_USE_MOCKS=1) и тестов. */
export const DEMO_USER: AuthSessionUser = {
  id: 'demo-user',
  name: 'Demo Seeker',
  email: 'demo@example.com',
  createdAt: '2026-01-01T00:00:00.000Z',
};

export const DEMO_QUOTA: TarotDailyQuota = { used: 0, limit: 3, day: '2026-10-01' };
export const DEMO_CREDITS = 3;
/** UUID как в реальной БД: от формата id зависит ссылка шаринга (t.me/?startapp=r_<hex32>). */
export const DEMO_SPREAD_ID = '11111111-1111-4111-8111-111111111111';

const DEMO_TOKEN = 'demo-token';
const DEMO_REFRESH = 'demo-refresh';

let session: AuthSessionUser | null = null;
let favorites: string[] = [];
let settings: TSettings = structuredClone(DEFAULT_SETTINGS);
let spreads: CloudSpreadRecord[] = [];

function seedSpread(): CloudSpreadRecord {
  return {
    id: DEMO_SPREAD_ID,
    userId: DEMO_USER.id,
    spreadKey: 'simple_daySuggest',
    name: 'spread:daySuggest',
    category: 'simple',
    question: 'Как пройдёт день?',
    interpretation: 'День будет спокойным.',
    cardsCount: 1,
    packIndex: 0,
    payload: {
      description: '',
      img: '',
      selectedCards: [],
      cardsPosition: [],
      cardsOrder: [],
      availableSubscriptions: [],
    },
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
  };
}

export function resetMockState(): void {
  session = null;
  favorites = [];
  settings = structuredClone(DEFAULT_SETTINGS);
  spreads = [seedSpread()];
}

export function getSession(): AuthSessionUser | null {
  return session;
}

export function loginDemo(): AuthSessionUser {
  session = { ...DEMO_USER };
  return session;
}

export function clearSession(): void {
  session = null;
}

export function updateSessionName(name: string): AuthSessionUser | null {
  if (!session) return null;
  session = { ...session, name };
  return session;
}

export function demoTokens(): { token: string; refreshToken: string } {
  return { token: DEMO_TOKEN, refreshToken: DEMO_REFRESH };
}

export function getFavorites(): string[] {
  return [...favorites];
}

export function addFavoriteId(cardId: string): void {
  if (!favorites.includes(cardId)) favorites.push(cardId);
}

export function removeFavoriteId(cardId: string): void {
  favorites = favorites.filter((id) => id !== cardId);
}

export function getSettingsState(): TSettings {
  return settings;
}

export function replaceSettings(next: TSettings): TSettings {
  settings = next;
  return settings;
}

export function patchSettingsState(patch: Partial<TSettings>): TSettings {
  settings = {
    sound: { ...settings.sound!, ...patch.sound },
    appearance: { ...settings.appearance, ...patch.appearance },
    spread: { ...settings.spread, ...patch.spread },
  };
  return settings;
}

export function listSpreads(): CloudSpreadRecord[] {
  return spreads;
}

export function getSpreadById(id: string): CloudSpreadRecord | null {
  return spreads.find((item) => item.id === id) ?? null;
}

export function createSpreadRecord(body: CreateSpreadBody): CloudSpreadRecord {
  const now = '2026-10-01T12:00:00.000Z';
  const record: CloudSpreadRecord = {
    id: crypto.randomUUID(),
    userId: session?.id ?? DEMO_USER.id,
    spreadKey: body.spreadKey,
    name: body.name,
    category: body.category ?? null,
    question: body.question ?? null,
    interpretation: body.interpretation ?? null,
    cardsCount: body.cardsCount ?? 0,
    packIndex: body.packIndex ?? 0,
    payload: body.payload,
    createdAt: now,
    updatedAt: now,
  };
  spreads = [record, ...spreads];
  return record;
}

export function updateSpreadRecord(
  id: string,
  patch: {
    interpretation?: string | null;
    question?: string | null;
    payload?: Record<string, unknown>;
  },
): CloudSpreadRecord | null {
  const current = getSpreadById(id);
  if (!current) return null;
  const next: CloudSpreadRecord = {
    ...current,
    interpretation: patch.interpretation !== undefined ? patch.interpretation : current.interpretation,
    question: patch.question !== undefined ? patch.question : current.question,
    payload: patch.payload ?? current.payload,
    updatedAt: '2026-10-01T12:30:00.000Z',
  };
  spreads = spreads.map((item) => (item.id === id ? next : item));
  return next;
}

resetMockState();
