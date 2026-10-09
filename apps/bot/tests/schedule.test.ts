import { describe, expect, it } from 'vitest';
import { msUntilMoscowTime } from '../src/schedule';

const MIN = 60_000;

describe('msUntilMoscowTime', () => {
  it('утром до 10:00 МСК — ждём до сегодняшних 10:00', () => {
    // 06:30 UTC = 09:30 МСК
    expect(msUntilMoscowTime(10, 0, 0, new Date('2026-10-10T06:30:00Z'))).toBe(30 * MIN);
  });

  it('после 10:00 МСК — ждём до завтрашних 10:00', () => {
    // 07:00:01 UTC = 10:00:01 МСК
    expect(msUntilMoscowTime(10, 0, 0, new Date('2026-10-10T07:00:01Z'))).toBe(24 * 60 * MIN - 1000);
  });

  it('ровно в 10:00 МСК — следующий запуск через сутки', () => {
    expect(msUntilMoscowTime(10, 0, 0, new Date('2026-10-10T07:00:00Z'))).toBe(24 * 60 * MIN);
  });

  it('поздно вечером по UTC, когда в Москве уже следующий день', () => {
    // 22:00 UTC = 01:00 МСК следующего дня → до 10:00 МСК 9 часов
    expect(msUntilMoscowTime(10, 0, 0, new Date('2026-10-10T22:00:00Z'))).toBe(9 * 60 * MIN);
  });
});
