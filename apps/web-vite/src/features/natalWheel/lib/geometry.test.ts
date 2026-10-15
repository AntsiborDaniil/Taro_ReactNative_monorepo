import { describe, expect, it } from 'vitest';
import { angularDistance, computeAspects, polarPoint, spreadLongitudes } from './geometry';

describe('natalWheel geometry', () => {
  it('угловое расстояние через 0°', () => {
    expect(angularDistance(350, 10)).toBe(20);
    expect(angularDistance(0, 180)).toBe(180);
  });

  it('аспекты: орбисы и напряжённость', () => {
    const asp = computeAspects([
      { id: 'sun', lon: 10 },
      { id: 'moon', lon: 98 }, // квадрат, орбис 2... 88 -> 2
      { id: 'mars', lon: 133 }, // трин к sun (123 -> орбис 3)
      { id: 'venus', lon: 195 }, // оппозиция к sun (185 -> 5)
    ]);
    const find = (a: string, b: string) => asp.find((x) => x.a === a && x.b === b);
    expect(find('sun', 'moon')?.type).toBe('square');
    expect(find('sun', 'moon')?.tense).toBe(true);
    expect(find('sun', 'mars')?.type).toBe('trine');
    expect(find('sun', 'venus')?.type).toBe('opposition');
  });

  it('вне орбиса аспекта нет', () => {
    expect(computeAspects([{ id: 'a', lon: 0 }, { id: 'b', lon: 45 }])).toHaveLength(0);
    expect(computeAspects([{ id: 'a', lon: 0 }, { id: 'b', lon: 69 }])).toHaveLength(0); // секстиль орбис 9 > 6
  });

  it('разводка: накладывающиеся планеты расходятся не меньше minGap', () => {
    const out = spreadLongitudes(
      [
        { id: 'a', lon: 100 },
        { id: 'b', lon: 101 },
        { id: 'c', lon: 102 },
        { id: 'd', lon: 200 },
      ],
      9
    );
    const v = ['a', 'b', 'c'].map((k) => out[k]);
    expect(v[1] - v[0]).toBeGreaterThanOrEqual(8.9);
    expect(v[2] - v[1]).toBeGreaterThanOrEqual(8.9);
    expect(out.d).toBeCloseTo(200, 0);
  });

  it('разводка через 0°', () => {
    const out = spreadLongitudes([{ id: 'a', lon: 359 }, { id: 'b', lon: 1 }], 9);
    expect(angularDistance(out.a, out.b)).toBeGreaterThanOrEqual(8.9);
  });

  it('polarPoint: ref слева', () => {
    const p = polarPoint(100, 100, 50);
    expect(p.x).toBeCloseTo(-50);
    expect(p.y).toBeCloseTo(0);
    const q = polarPoint(190, 100, 50); // +90° -> снизу? против часовой: слева -> вниз
    expect(q.x).toBeCloseTo(0);
    expect(q.y).toBeCloseTo(50);
  });
});
