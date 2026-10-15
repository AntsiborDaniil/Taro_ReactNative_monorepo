import { describe, expect, it } from 'vitest';
import { MakeTime } from 'astronomy-engine';
import { angles, longitudeOf, natalChart, phaseName, zonedToUtc } from './engine';
import { sunSignByDate, signOfLongitude } from './zodiac';

describe('astro engine', () => {
  it('эпоха J2000: Солнце ~280.4°, Луна ~223.3°', () => {
    const t = MakeTime(new Date('2000-01-01T12:00:00Z'));
    expect(longitudeOf('sun', t)).toBeCloseTo(280.37, 1);
    expect(longitudeOf('moon', t)).toBeCloseTo(223.32, 0);
  });

  it('асцендент: на экваторе при RAMC 0° — 0° Рака', () => {
    // Момент, когда в Гринвиче звёздное время ≈ 0ч: 2000-09-21 ~ 23:59 UT (проверяем формулой через долготу).
    const date = new Date('2000-01-01T12:00:00Z');
    const { asc } = angles(date, 0, -18.6971 * 15);
    expect(asc).toBeCloseTo(90, 0);
  });

  it('асцендент Лондона при местном звёздном 0ч ≈ 26.6° Рака', () => {
    const date = new Date('2000-01-01T12:00:00Z');
    const { asc } = angles(date, 51.5, -18.6971 * 15);
    expect(signOfLongitude(asc)).toEqual({ sign: 'cancer', degree: 26 });
  });

  it('исторический пояс: Москва летом 1996 — UTC+4 (летнее время)', () => {
    expect(zonedToUtc('1996-07-01', '12:00', 'Europe/Moscow').toISOString()).toBe('1996-07-01T08:00:00.000Z');
    expect(zonedToUtc('2015-07-01', '12:00', 'Europe/Moscow').toISOString()).toBe('2015-07-01T09:00:00.000Z');
  });

  it('без времени — нет асцендента и домов', () => {
    const chart = natalChart({ date: '1996-10-14', time: null, lat: null, lon: null, tz: null });
    expect(chart.asc).toBeNull();
    expect(chart.planets.every((p) => p.house === null)).toBe(true);
    expect(chart.planets[0].sign).toBe('libra');
  });

  it('фазы и знак по дате', () => {
    expect(phaseName(0)).toBe('new');
    expect(phaseName(180)).toBe('full');
    expect(sunSignByDate(10, 14)).toBe('libra');
    expect(sunSignByDate(1, 5)).toBe('capricorn');
    expect(sunSignByDate(3, 21)).toBe('aries');
    expect(sunSignByDate(2, 18)).toBe('aquarius');
  });
});
