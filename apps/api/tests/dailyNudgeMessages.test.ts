import { describe, expect, it } from 'vitest';
import {
  NUDGE_BUTTONS_EN,
  NUDGE_BUTTONS_RU,
  NUDGE_FRIDAY_EN,
  NUDGE_FRIDAY_RU,
  NUDGE_MONDAY_EN,
  NUDGE_MONDAY_RU,
  NUDGE_SUNDAY_EN,
  NUDGE_SUNDAY_RU,
  NUDGE_TEXTS_EN,
  NUDGE_TEXTS_RU,
  pickDailyNudge,
  type NudgeLang,
} from '../src/lib/dailyNudgeMessages';

const LANGS: NudgeLang[] = ['ru', 'en'];

function addDays(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

const pick = (lang: NudgeLang, day: string, key = '123456', paid = false) =>
  pickDailyNudge({ lang, day, recipientKey: key, hasPaidCredits: paid });

describe('pickDailyNudge', () => {
  it('пулы достаточно большие', () => {
    expect(NUDGE_TEXTS_RU.length).toBeGreaterThanOrEqual(21);
    expect(NUDGE_TEXTS_EN.length).toBeGreaterThanOrEqual(21);
  });

  it('детерминирован', () => {
    for (const lang of LANGS) {
      expect(pick(lang, '2026-10-16')).toEqual(pick(lang, '2026-10-16'));
    }
  });

  it('соседние дни одного получателя различаются', () => {
    for (const lang of LANGS) {
      for (let i = 0; i < 60; i++) {
        const a = pick(lang, addDays('2026-09-01', i)).text;
        const b = pick(lang, addDays('2026-09-01', i + 1)).text;
        expect(a).not.toBe(b);
      }
    }
  });

  it('N подряд календарных дней — нетематические все разные', () => {
    for (const lang of LANGS) {
      const n = (lang === 'ru' ? NUDGE_TEXTS_RU : NUDGE_TEXTS_EN).length;
      const texts: string[] = [];
      for (let i = 0; i < n; i++) {
        const day = addDays('2026-01-01', i);
        if ([0, 1, 5].includes(new Date(`${day}T00:00:00Z`).getUTCDay())) continue;
        texts.push(pick(lang, day).text);
      }
      expect(new Set(texts).size).toBe(texts.length);
    }
  });

  it('тексты пн/пт/вс только в свои дни, в остальные — общий пул', () => {
    const themedByDay: Record<NudgeLang, Record<number, readonly string[]>> = {
      ru: { 1: NUDGE_MONDAY_RU, 5: NUDGE_FRIDAY_RU, 0: NUDGE_SUNDAY_RU },
      en: { 1: NUDGE_MONDAY_EN, 5: NUDGE_FRIDAY_EN, 0: NUDGE_SUNDAY_EN },
    };
    for (const lang of LANGS) {
      const common = lang === 'ru' ? NUDGE_TEXTS_RU : NUDGE_TEXTS_EN;
      const all = Object.values(themedByDay[lang]).flat();
      for (const pool of Object.values(themedByDay[lang])) expect(pool.length).toBeGreaterThanOrEqual(3);
      expect(common.length).toBeGreaterThanOrEqual(21);
      for (let i = 0; i < 70; i++) {
        const day = addDays('2026-09-01', i);
        const wd = new Date(`${day}T00:00:00Z`).getUTCDay();
        for (const key of ['1', '42', '777001', '5550123']) {
          const text = pick(lang, day, key).text;
          if (wd in themedByDay[lang]) expect(themedByDay[lang][wd]).toContain(text);
          else {
            expect(common).toContain(text);
            expect(all).not.toContain(text);
          }
        }
      }
    }
  });

  it('разные получатели в один день распределены', () => {
    for (const lang of LANGS) {
      const set = new Set(
        Array.from({ length: 50 }, (_, i) => pick(lang, '2026-10-13', String(100000 + i * 7919)).text),
      );
      expect(set.size).toBeGreaterThan(5);
    }

    // Тематический день (пятница): три варианта распределяются между людьми.
    for (const lang of LANGS) {
      const set = new Set(Array.from({ length: 50 }, (_, i) => pick(lang, '2026-10-16', String(100000 + i * 7919)).text));
      expect(set.size).toBe(3);
    }
  });

  it('длина, отсутствие Markdown, алфавит, кнопка', () => {
    for (const lang of LANGS) {
      for (let i = 0; i < 100; i++) {
        for (const paid of [false, true]) {
          const r = pick(lang, addDays('2026-01-01', i), String(i * 31 + 5), paid);
          expect(r.text.length).toBeLessThanOrEqual(350);
          expect(r.text).not.toMatch(/[*_[`]/);
          expect(r.buttonLabel.length).toBeLessThanOrEqual(24);
          expect(NUDGE_BUTTONS_RU.concat(NUDGE_BUTTONS_EN)).toContain(r.buttonLabel);
          if (lang === 'en') expect(r.text + r.buttonLabel).not.toMatch(/[А-Яа-яЁё]/);
          else expect(r.text).toMatch(/[А-Яа-яЁё]/);
        }
      }
    }
  });

  it('при платных зарядах добавляется строка-напоминание', () => {
    for (const lang of LANGS) {
      const base = pick(lang, '2026-10-16', '1', false).text;
      const paid = pick(lang, '2026-10-16', '1', true).text;
      expect(paid.startsWith(base)).toBe(true);
      expect(paid.length).toBeGreaterThan(base.length);
    }
  });
});
