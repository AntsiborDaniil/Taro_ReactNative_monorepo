import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/lib/devMode', () => ({ useMemoryBackend: () => true }));

import {
  memoryGetSpreadCredits,
  memoryGetTarotDailyUsage,
  memorySignInWithTelegram,
  memoryTryConsumeTarotDailySlot,
} from '../src/dev/memoryBackend';
import { FREE_DAILY_CHARGES } from '../src/lib/env';

/** Бесплатных зарядов сейчас: limit − used. */
function freeCharges(userId: string): number {
  const { used, limit } = memoryGetTarotDailyUsage(userId);
  return Math.max(0, limit - used);
}

function at(iso: string) {
  vi.setSystemTime(new Date(iso));
}

describe('бесплатный дневной заряд', () => {
  afterEach(() => {
    vi.useRealTimers();
    delete process.env.TAROT_DAILY_INTERPRET_LIMIT;
  });

  it('новый пользователь сразу имеет ровно 1 бесплатный заряд и 0 платных', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    at('2026-10-20T09:00:00Z');
    const { user } = memorySignInWithTelegram({ telegramId: 880001, displayName: 'Нов' });
    expect(FREE_DAILY_CHARGES).toBe(1);
    expect(freeCharges(user.id)).toBe(1);
    expect(memoryGetSpreadCredits(user.id)).toBe(0);
  });

  it('потратил → 0 до 10:00 МСК, в 10:00 снова 1', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    at('2026-10-20T08:00:00Z'); // 11:00 МСК
    const { user } = memorySignInWithTelegram({ telegramId: 880002, displayName: 'A' });
    expect(memoryTryConsumeTarotDailySlot(user.id).ok).toBe(true);
    expect(freeCharges(user.id)).toBe(0);
    expect(memoryTryConsumeTarotDailySlot(user.id).ok).toBe(false);

    at('2026-10-21T06:59:59Z'); // 09:59:59 МСК — ещё вчерашний день слота
    expect(freeCharges(user.id)).toBe(0);
    at('2026-10-21T07:00:00Z'); // 10:00 МСК
    expect(freeCharges(user.id)).toBe(1);
  });

  it('не потратил → в 10:00 не копится, остаётся 1', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    at('2026-10-20T08:00:00Z');
    const { user } = memorySignInWithTelegram({ telegramId: 880003, displayName: 'B' });
    expect(freeCharges(user.id)).toBe(1);
    at('2026-10-21T07:00:00Z');
    expect(freeCharges(user.id)).toBe(1);
    at('2026-10-23T07:00:00Z');
    expect(freeCharges(user.id)).toBe(1);
  });
});
