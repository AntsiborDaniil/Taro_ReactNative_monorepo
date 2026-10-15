import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fallbackHoroscope,
  getDailyHoroscope,
  horoscopeCacheKey,
  parseHoroscopeModelOutput,
  resetHoroscopeCache,
} from '../src/services/astroHoroscopeService';

const good = JSON.stringify({
  text: 'Сегодня хороший день, чтобы замедлиться и понаблюдать за собой без спешки.',
  question: 'Что меня поддержит?',
  facets: { love: 'warm', work: 'bad', energy: 'gentle' },
});

describe('parseHoroscopeModelOutput', () => {
  it('принимает валидный JSON и чинит неизвестную грань', () => {
    const r = parseHoroscopeModelOutput(good);
    expect(r?.facets).toEqual({ love: 'warm', work: 'even', energy: 'gentle' });
  });
  it('мусор -> null', () => {
    expect(parseHoroscopeModelOutput('не json')).toBeNull();
    expect(parseHoroscopeModelOutput('{"text":"коротко"}')).toBeNull();
    expect(parseHoroscopeModelOutput(null)).toBeNull();
  });
  it('fallback соответствует контракту', () => {
    const f = fallbackHoroscope('leo', '2026-10-10', 'ru');
    expect(f.question).toBeTruthy();
    expect(['warm', 'even', 'gentle']).toContain(f.facets.love);
  });
});

describe('кэш', () => {
  beforeEach(() => resetHoroscopeCache());

  it('ключ: день:знак:язык', () => {
    expect(horoscopeCacheKey('2026-10-10', 'leo', 'ru')).toBe('2026-10-10:leo:ru');
  });

  it('параллельные запросы -> одна генерация', async () => {
    const gen = vi.fn(async (sign: any, day: string) => ({ ...fallbackHoroscope(sign, day, 'ru') }));
    const [a, b] = await Promise.all([
      getDailyHoroscope('leo', 'ru', gen),
      getDailyHoroscope('leo', 'ru', gen),
    ]);
    expect(gen).toHaveBeenCalledTimes(1);
    expect(a).toBe(b);
    await getDailyHoroscope('leo', 'en', gen);
    expect(gen).toHaveBeenCalledTimes(2);
  });

  it('ошибка не кэшируется', async () => {
    const gen = vi.fn().mockRejectedValueOnce(new Error('x')).mockResolvedValue(fallbackHoroscope('leo', 'd', 'ru'));
    await expect(getDailyHoroscope('leo', 'ru', gen)).rejects.toThrow();
    await getDailyHoroscope('leo', 'ru', gen);
    expect(gen).toHaveBeenCalledTimes(2);
  });
});
