import { describe, expect, it } from 'vitest';
import { tarotCards } from '@legacy-data';
import { computeMirror, suitOfCard, type MirrorSpreadInput } from './computeMirror';

const END = new Date(2026, 9, 7, 12, 0, 0); // 7 окт 2026, локально

function spreadOn(day: number, ids: string[], reversed: string[] = [], hour = 10): MirrorSpreadInput {
  return {
    date: new Date(2026, 9, day, hour).toISOString(),
    selectedCards: ids.map((id) => ({ id, direction: reversed.includes(id) ? 'reversed' : 'upright' })),
  };
}

function mood(day: number, values: Partial<Record<'mood' | 'energy' | 'stress', number>>) {
  const date = `2026-10-${String(day).padStart(2, '0')}`;
  return { date, mood: null, energy: null, stress: null, ...values };
}

describe('suitOfCard', () => {
  it('совпадает с cardsData для всех 78 карт', () => {
    for (const card of Object.values(tarotCards)) {
      const expected = card.arcana === 'major' ? 'major' : card.suit;
      expect(suitOfCard(card.id)).toBe(expected);
    }
  });

  it('мусорный id → null', () => {
    expect(suitOfCard('abc')).toBeNull();
    expect(suitOfCard('78')).toBeNull();
  });
});

describe('computeMirror', () => {
  it('пустые данные не падают', () => {
    const r = computeMirror({ spreads: [], moods: [], endDate: END });
    expect(r.spreadsCount).toBe(0);
    expect(r.missingSpreads).toBe(3);
    expect(r.frequent).toEqual([]);
    expect(r.dominantSuit).toBeNull();
    expect(r.reversedPercent).toBe(0);
    expect(r.insights).toEqual([]);
  });

  it('учитывает только 7 дней окна', () => {
    const old = { date: new Date(2026, 8, 30, 10).toISOString(), selectedCards: [{ id: '3' }] };
    const r = computeMirror({
      spreads: [spreadOn(7, ['1']), spreadOn(1, ['2']), old],
      moods: [],
      endDate: END,
    });
    // окно 1..7 окт включительно: 1 окт внутри, 30 сен снаружи
    expect(r.spreadsCount).toBe(2);
  });

  it('частые карты: только ≥2 появлений, сортировка по числу', () => {
    const r = computeMirror({
      spreads: [spreadOn(7, ['18', '5']), spreadOn(6, ['18']), spreadOn(5, ['18', '5', '9'])],
      moods: [],
      endDate: END,
    });
    expect(r.frequent[0]).toEqual({ cardId: '18', count: 3 });
    expect(r.frequent[1]).toEqual({ cardId: '5', count: 2 });
    // '9' выпала один раз — в «частые» не попадает (иначе это просто последние карты).
    expect(r.frequent).toHaveLength(2);
    expect(r.cardsCount).toBe(6);
    expect(r.cardOfWeek).toEqual({ cardId: '18', count: 3 });
  });

  it('дни недели: все карты дня и отметка настроения; средние по метрикам', () => {
    const r = computeMirror({
      spreads: [spreadOn(7, ['18', '5']), spreadOn(7, ['40'], [], 15), spreadOn(5, ['9'])],
      moods: [
        { date: '2026-10-07', mood: 8, energy: 6, stress: 2 },
        { date: '2026-10-03', mood: 4, energy: null, stress: 6 },
      ],
      endDate: END,
    });
    expect(r.days.map((d) => d.day)).toEqual(['2026-10-07', '2026-10-05', '2026-10-03']);
    expect(r.days[0].cards.map((c) => c.id)).toEqual(['18', '5', '40']);
    expect(r.days[0].mood).toEqual({ mood: 8, energy: 6, stress: 2 });
    expect(r.days[2].cards).toEqual([]);
    expect(r.moodAverages).toEqual({ mood: 6, energy: 6, stress: 4 });
    // повторов нет → карта недели = свежий Старший аркан
    expect(r.cardOfWeek).toEqual({ cardId: '18', count: 1 });
  });

  it('масти, перевёрнутые и доминирующая масть', () => {
    const r = computeMirror({
      spreads: [spreadOn(7, ['50', '51', '0'], ['50']), spreadOn(6, ['52']), spreadOn(5, ['36'])],
      moods: [],
      endDate: END,
    });
    expect(r.suitCounts.swords).toBe(3);
    expect(r.dominantSuit).toBe('swords');
    expect(r.suitPercents.swords).toBe(60);
    expect(r.reversedCount).toBe(1);
    expect(r.reversedPercent).toBe(20);
  });

  it('ничья масть → без доминирующей', () => {
    const r = computeMirror({ spreads: [spreadOn(7, ['50', '36'])], moods: [], endDate: END });
    expect(r.dominantSuit).toBeNull();
  });

  it('масть ↔ настроение: разница ≥1,5 и по ≥2 дня в группах', () => {
    const spreads = [spreadOn(7, ['50']), spreadOn(6, ['51']), spreadOn(5, ['36']), spreadOn(4, ['37'])];
    const moods = [
      mood(7, { stress: 8 }),
      mood(6, { stress: 6 }),
      mood(5, { stress: 4 }),
      mood(4, { stress: 4 }),
    ];
    const r = computeMirror({ spreads, moods, endDate: END });
    const swords = r.insights.find((i) => i.suit === 'swords' && i.metric === 'stress');
    expect(swords).toMatchObject({ withAvg: 7, withoutAvg: 4, higher: true });
    expect(r.insights.length).toBeLessThanOrEqual(2);
  });

  it('малая разница или мало дней → инсайтов нет', () => {
    const spreads = [spreadOn(7, ['50']), spreadOn(6, ['36']), spreadOn(5, ['37'])];
    expect(
      computeMirror({ spreads, moods: [mood(7, { stress: 5 }), mood(6, { stress: 4 }), mood(5, { stress: 4 })], endDate: END })
        .insights,
    ).toEqual([]);
    // в группе «с Мечами» всего 1 день
    expect(
      computeMirror({ spreads, moods: [mood(7, { stress: 9 }), mood(6, { stress: 1 }), mood(5, { stress: 1 })], endDate: END })
        .insights.filter((i) => i.suit === 'swords'),
    ).toEqual([]);
  });

  it('вытянутая «Карта недели» важнее самой частой карты', () => {
    const weekCard = { ...spreadOn(6, ['21'], ['21']), id: 'period_weekCard' };
    const r = computeMirror({
      spreads: [spreadOn(7, ['18']), spreadOn(5, ['18']), weekCard],
      moods: [],
      endDate: END,
    });
    expect(r.frequent[0]).toEqual({ cardId: '18', count: 2 });
    expect(r.cardOfWeek).toEqual({ cardId: '21', count: 1 });
    expect(r.cardOfWeekSource).toBe('drawn');
    expect(r.cardOfWeekDirection).toBe('reversed');
  });
});
