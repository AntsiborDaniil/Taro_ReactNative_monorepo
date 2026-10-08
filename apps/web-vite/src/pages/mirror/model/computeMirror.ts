import type { TMemoryMoodItem, TMoodItem } from '@entities/mood/model/types';
import { getDateISO } from '@shared/lib/date';

/** Минимальный срез расклада, нужный зеркалу (TSpread ему удовлетворяет). */
export type MirrorSpreadInput = {
  /** Каталожный id расклада (period_weekCard — вытянутая «Карта недели»). */
  id?: string;
  date?: string;
  selectedCards?: Array<{ id: string; direction?: string }>;
};

export type MirrorSuit = 'major' | 'cups' | 'wands' | 'swords' | 'pentacles';
export type MirrorMetric = keyof TMoodItem;

export const MIRROR_SUITS: MirrorSuit[] = ['major', 'cups', 'wands', 'swords', 'pentacles'];
/** Минимум раскладов за неделю, чтобы зеркало что-то показывало. */
export const MIRROR_MIN_SPREADS = 3;
/** Сколько дней с отметкой настроения нужно для связей «масть ↔ настроение». */
export const MIRROR_MIN_MOOD_DAYS = 3;
/** Доля Старших арканов в колоде: 22 из 78. */
export const MAJOR_EXPECTED_SHARE = 22 / 78;
const INSIGHT_MIN_DAYS_PER_GROUP = 2;
const INSIGHT_MIN_DAYS_TOTAL = 3;
const INSIGHT_MIN_DIFF = 1.5;
const INSIGHT_LIMIT = 2;
const DAY_MS = 24 * 60 * 60 * 1000;

export type MirrorFrequentCard = { cardId: string; count: number };

/** Откуда «Карта недели»: вытянута как расклад недели / самая частая / свежий Старший аркан. */
export type MirrorCardOfWeekSource = 'drawn' | 'frequent' | 'fresh';

const WEEK_CARD_SPREAD_ID = 'period_weekCard';

export type MirrorInsight = {
  suit: MirrorSuit;
  metric: MirrorMetric;
  /** Среднее в дни с мастью / в остальные дни (с отметкой), округлено до целых. */
  withAvg: number;
  withoutAvg: number;
  /** true — в дни с мастью значение выше. */
  higher: boolean;
};

/** День окна: все карты дня по порядку + отметка настроения (если была). */
export type MirrorDay = {
  day: string;
  date: Date;
  cards: Array<{ id: string; direction?: string }>;
  mood: TMoodItem | null;
};

export type MirrorResult = {
  /** Первый и последний день окна (локальные 00:00). */
  rangeStart: Date;
  rangeEnd: Date;
  spreadsCount: number;
  cardsCount: number;
  /** Не хватает раскладов для зеркала: сколько ещё вытянуть. */
  missingSpreads: number;
  frequent: MirrorFrequentCard[];
  suitCounts: Record<MirrorSuit, number>;
  /** Доли в процентах (целые); сумма может отличаться от 100 на единицу-две из-за округления. */
  suitPercents: Record<MirrorSuit, number>;
  dominantSuit: MirrorSuit | null;
  majorSharePercent: number;
  reversedCount: number;
  reversedPercent: number;
  /** Дней с хотя бы одной отметкой настроения в окне. */
  moodDaysCount: number;
  insights: MirrorInsight[];
  /** Дни окна, где были расклады или отметка настроения (от новых к старым). */
  days: MirrorDay[];
  /** Средние за неделю по дням с отметкой (0–10, одна десятая), null — отметок нет. */
  moodAverages: Record<MirrorMetric, number | null>;
  /**
   * «Карта недели»: самая частая (≥2), иначе — самый свежий Старший аркан,
   * иначе — последняя вытянутая карта. null — карт нет.
   */
  cardOfWeek: MirrorFrequentCard | null;
  cardOfWeekSource: MirrorCardOfWeekSource | null;
  /** Направление вытянутой «Карты недели» (для drawn). */
  cardOfWeekDirection?: string;
};

export type ComputeMirrorOptions = {
  spreads: MirrorSpreadInput[];
  moods: TMemoryMoodItem[];
  /** Последний день окна из 7 дней (по умолчанию сегодня). */
  endDate?: Date;
};

/**
 * Масть по числовому id карты (порядок в колоде: 0–21 Старшие, 22–35 Жезлы,
 * 36–49 Кубки, 50–63 Мечи, 64–77 Пентакли — сверено с cardsData тестом).
 */
export function suitOfCard(cardId: string): MirrorSuit | null {
  const id = Number(cardId);
  if (!Number.isInteger(id) || id < 0 || id > 77) return null;
  if (id <= 21) return 'major';
  if (id <= 35) return 'wands';
  if (id <= 49) return 'cups';
  if (id <= 63) return 'swords';
  return 'pentacles';
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function emptySuitRecord(): Record<MirrorSuit, number> {
  return { major: 0, cups: 0, wands: 0, swords: 0, pentacles: 0 };
}

const METRICS: MirrorMetric[] = ['mood', 'energy', 'stress'];

/**
 * Чистая функция: «зеркало недели» из раскладов и отметок настроения за окно
 * из 7 дней (включая endDate). Без LLM; корреляции — только наблюдение за
 * совпадениями дней, не выводы о причинах.
 */
export function computeMirror({ spreads, moods, endDate = new Date() }: ComputeMirrorOptions): MirrorResult {
  const rangeEnd = startOfDay(endDate);
  const rangeStart = new Date(rangeEnd.getTime() - 6 * DAY_MS);
  // Ключи дней окна: через setDate, чтобы не ломаться на переводе часов.
  const dayKeys = new Set<string>();
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(rangeStart);
    d.setDate(rangeStart.getDate() + i);
    dayKeys.add(getDateISO(d));
  }

  const inWindow: Array<{ spreadId?: string; day: string; time: number; cards: Array<{ id: string; direction?: string }> }> = [];
  for (const spread of spreads) {
    if (!spread.date) continue;
    const when = new Date(spread.date);
    if (Number.isNaN(when.getTime())) continue;
    const day = getDateISO(when);
    if (!dayKeys.has(day)) continue;
    inWindow.push({ spreadId: spread.id, day, time: when.getTime(), cards: spread.selectedCards ?? [] });
  }
  // Новые раскладки первыми — для tie-break «недавние выше».
  inWindow.sort((a, b) => b.time - a.time);

  const suitCounts = emptySuitRecord();
  const cardStats = new Map<string, { count: number; order: number }>();
  const suitsByDay = new Map<string, Set<MirrorSuit>>();
  let cardsCount = 0;
  let reversedCount = 0;
  let order = 0;

  for (const spread of inWindow) {
    for (const card of spread.cards) {
      cardsCount += 1;
      if (card.direction === 'reversed') reversedCount += 1;
      const stat = cardStats.get(card.id);
      if (stat) stat.count += 1;
      else cardStats.set(card.id, { count: 1, order: order });
      order += 1;
      const suit = suitOfCard(card.id);
      if (!suit) continue;
      suitCounts[suit] += 1;
      let set = suitsByDay.get(spread.day);
      if (!set) {
        set = new Set();
        suitsByDay.set(spread.day, set);
      }
      set.add(suit);
    }
  }

  const suitTotal = MIRROR_SUITS.reduce((sum, s) => sum + suitCounts[s], 0);
  const suitPercents = emptySuitRecord();
  if (suitTotal > 0) {
    for (const s of MIRROR_SUITS) suitPercents[s] = Math.round((suitCounts[s] / suitTotal) * 100);
  }

  // Частые — только карты, выпавшие ≥2 раз (иначе это просто последние карты).
  const frequent = [...cardStats.entries()]
    .map(([cardId, s]) => ({ cardId, count: s.count, order: s.order }))
    .filter((c) => c.count >= 2)
    .sort((a, b) => b.count - a.count || a.order - b.order)
    .slice(0, 3)
    .map(({ cardId, count }) => ({ cardId, count }));

  const allCardsNewestFirst = inWindow.flatMap((sp) => sp.cards);
  const freshMajor = allCardsNewestFirst.find((c) => suitOfCard(c.id) === 'major');
  const fallbackCard = freshMajor ?? allCardsNewestFirst[0];
  // Вытянутая «Карта недели» (расклад периода) важнее статистики — это осознанный выбор.
  const drawnWeek = inWindow.find((sp) => sp.spreadId === WEEK_CARD_SPREAD_ID && sp.cards[0]);
  const drawnCard = drawnWeek?.cards[0];
  const cardOfWeek: MirrorFrequentCard | null = drawnCard
    ? { cardId: drawnCard.id, count: cardStats.get(drawnCard.id)?.count ?? 1 }
    : frequent[0] ?? (fallbackCard ? { cardId: fallbackCard.id, count: cardStats.get(fallbackCard.id)?.count ?? 1 } : null);
  const cardOfWeekSource: MirrorCardOfWeekSource | null = drawnCard ? 'drawn' : frequent[0] ? 'frequent' : fallbackCard ? 'fresh' : null;

  const sortedSuits = [...MIRROR_SUITS].sort((a, b) => suitCounts[b] - suitCounts[a]);
  const dominantSuit =
    suitTotal > 0 && suitCounts[sortedSuits[0]] > suitCounts[sortedSuits[1]] ? sortedSuits[0] : null;

  // Настроение: берём последнюю запись дня, если их несколько.
  const moodByDay = new Map<string, TMemoryMoodItem>();
  for (const item of moods) {
    if (dayKeys.has(item.date)) moodByDay.set(item.date, item);
  }
  const moodDaysCount = [...moodByDay.values()].filter((m) => METRICS.some((k) => m[k] != null)).length;

  const candidates: Array<MirrorInsight & { diff: number }> = [];
  for (const metric of METRICS) {
    const entries = [...moodByDay.entries()].filter(([, m]) => m[metric] != null) as Array<[string, TMemoryMoodItem]>;
    if (entries.length < INSIGHT_MIN_DAYS_TOTAL) continue;
    for (const suit of MIRROR_SUITS) {
      const withSuit: number[] = [];
      const without: number[] = [];
      for (const [day, m] of entries) {
        (suitsByDay.get(day)?.has(suit) ? withSuit : without).push(m[metric] as number);
      }
      if (withSuit.length < INSIGHT_MIN_DAYS_PER_GROUP || without.length < INSIGHT_MIN_DAYS_PER_GROUP) continue;
      const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
      const a = avg(withSuit);
      const b = avg(without);
      const diff = a - b;
      if (Math.abs(diff) < INSIGHT_MIN_DIFF) continue;
      candidates.push({
        suit,
        metric,
        withAvg: Math.round(a),
        withoutAvg: Math.round(b),
        higher: diff > 0,
        diff,
      });
    }
  }
  const insights = candidates
    .sort((x, y) => Math.abs(y.diff) - Math.abs(x.diff))
    .slice(0, INSIGHT_LIMIT)
    .map(({ diff: _diff, ...insight }) => insight);

  // Дни: расклады дня (старые → новые внутри дня) + отметка настроения.
  const daysMap = new Map<string, MirrorDay>();
  const ensureDay = (key: string): MirrorDay => {
    let d = daysMap.get(key);
    if (!d) {
      const [y, m, dd] = key.split('-').map(Number);
      d = { day: key, date: new Date(y, m - 1, dd), cards: [], mood: null };
      daysMap.set(key, d);
    }
    return d;
  };
  for (const sp of [...inWindow].reverse()) ensureDay(sp.day).cards.push(...sp.cards);
  for (const [key, m] of moodByDay) {
    if (METRICS.some((k) => m[k] != null)) ensureDay(key).mood = { mood: m.mood, energy: m.energy, stress: m.stress };
  }
  const days = [...daysMap.values()].sort((a, b) => b.date.getTime() - a.date.getTime());

  const moodAverages = { mood: null, energy: null, stress: null } as Record<MirrorMetric, number | null>;
  for (const metric of METRICS) {
    const values = [...moodByDay.values()].map((m) => m[metric]).filter((v): v is number => v != null);
    if (values.length) moodAverages[metric] = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
  }

  return {
    rangeStart,
    rangeEnd,
    spreadsCount: inWindow.length,
    cardsCount,
    missingSpreads: Math.max(0, MIRROR_MIN_SPREADS - inWindow.length),
    frequent,
    suitCounts,
    suitPercents,
    dominantSuit,
    majorSharePercent: suitPercents.major,
    reversedCount,
    reversedPercent: cardsCount > 0 ? Math.round((reversedCount / cardsCount) * 100) : 0,
    moodDaysCount,
    insights,
    days,
    moodAverages,
    cardOfWeek,
    cardOfWeekSource,
    cardOfWeekDirection: drawnCard?.direction,
  };
}
