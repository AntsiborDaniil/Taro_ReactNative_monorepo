/**
 * Чистая геометрия и аспекты натального колеса — без React и эфемерид (тестируется отдельно).
 */
export type AspectType = 'conjunction' | 'sextile' | 'square' | 'trine' | 'opposition';

export const ASPECT_DEFS: ReadonlyArray<{ type: AspectType; angle: number; orb: number; tense: boolean }> = [
  { type: 'conjunction', angle: 0, orb: 8, tense: false },
  { type: 'sextile', angle: 60, orb: 6, tense: false },
  { type: 'square', angle: 90, orb: 7, tense: true },
  { type: 'trine', angle: 120, orb: 8, tense: false },
  { type: 'opposition', angle: 180, orb: 8, tense: true },
];

export type Aspect = { a: string; b: string; type: AspectType; orb: number; tense: boolean };

/** Угловое расстояние между долготами, 0–180. */
export function angularDistance(a: number, b: number): number {
  const d = Math.abs((((a - b) % 360) + 360) % 360);
  return d > 180 ? 360 - d : d;
}

/** Аспекты между всеми парами тел (мажорные, с орбисами 8/6/7/8/8). */
export function computeAspects(bodies: ReadonlyArray<{ id: string; lon: number }>): Aspect[] {
  const result: Aspect[] = [];
  for (let i = 0; i < bodies.length; i += 1) {
    for (let j = i + 1; j < bodies.length; j += 1) {
      const dist = angularDistance(bodies[i].lon, bodies[j].lon);
      for (const def of ASPECT_DEFS) {
        const orb = Math.abs(dist - def.angle);
        if (orb <= def.orb) {
          result.push({ a: bodies[i].id, b: bodies[j].id, type: def.type, orb, tense: def.tense });
          break;
        }
      }
    }
  }
  return result;
}

/**
 * Разводка наложений глифов: возвращает отображаемые долготы (id → градусы), где
 * соседние планеты разнесены минимум на minGap. Исходный порядок по кругу сохраняется.
 */
export function spreadLongitudes(
  bodies: ReadonlyArray<{ id: string; lon: number }>,
  minGap = 9
): Record<string, number> {
  const n = bodies.length;
  const out: Record<string, number> = {};
  if (n === 0) return out;
  const sorted = [...bodies].map((b) => ({ id: b.id, lon: ((b.lon % 360) + 360) % 360 })).sort((x, y) => x.lon - y.lon);
  if (n * minGap >= 360) {
    sorted.forEach((b, i) => (out[b.id] = (i * 360) / n));
    return out;
  }
  const pos = sorted.map((b) => b.lon);
  for (let iter = 0; iter < 500; iter += 1) {
    let moved = false;
    for (let i = 0; i < n; i += 1) {
      const j = (i + 1) % n;
      const gap = j === 0 ? pos[0] + 360 - pos[n - 1] : pos[j] - pos[i];
      if (gap < minGap - 0.001) {
        const push = (minGap - gap) / 2;
        pos[i] -= push;
        pos[j] += push;
        moved = true;
      }
    }
    if (!moved) break;
  }
  sorted.forEach((b, i) => (out[b.id] = ((pos[i] % 360) + 360) % 360));
  return out;
}

/**
 * Точка на колесе. ref — долгота, лежащая слева (ASC; без времени — 0° Овна).
 * Зодиак идёт против часовой стрелки, как на классической карте.
 */
export function polarPoint(lon: number, ref: number, radius: number): { x: number; y: number } {
  const angle = ((180 + (lon - ref)) * Math.PI) / 180;
  return { x: radius * Math.cos(angle), y: -radius * Math.sin(angle) };
}
