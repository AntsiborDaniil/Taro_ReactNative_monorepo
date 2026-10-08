import type { TarotPosition } from '../types';
import type { SpreadRecord } from './spreadsService';

/** Позиция расклада с метаданными карты (клиент шлёт card_id/arcana/suit — их считает код, не модель). */
export type InterpretPosition = TarotPosition & {
  card_id?: string;
  arcana?: string;
  suit?: string | null;
};

/** Необязательный контекст пользователя от клиента (локальные данные: настроение, привычки). */
export type InterpretContext = {
  mood?: {
    mood?: number | null;
    energy?: number | null;
    stress?: number | null;
    /** YYYY-MM-DD — дата записи на клиенте. */
    date?: string;
  };
  habits?: string[];
};

/** Структура для клиента: он форматирует через i18n. */
export type MemoryNote =
  | { kind: 'card'; cardId: string; date: string; spreadName: string }
  | { kind: 'suit'; suit: string; pct: number };

/** Статистика истории за 30 дней — для плашек глубокого разбора (без LLM, считает код). */
export type MemoryStats = {
  spreadsCount: number;
  cardsCount: number;
  /** Карты, выпадавшие ≥2 раз, по убыванию. */
  topCards: Array<{ cardId: string; count: number }>;
  dominantSuit: { suit: string; pct: number } | null;
  reversedPct: number | null;
  /** Карты текущего расклада, которые уже выпадали: последняя дата. */
  repeats: Array<{ cardId: string; count: number; lastDate: string }>;
};

export type SpreadMemory = {
  /** Текст блока ПАМЯТЬ для промпта (пустая строка — памяти нет). */
  block: string;
  note: MemoryNote | null;
  stats: MemoryStats | null;
};

const MS_DAY = 24 * 60 * 60 * 1000;
const MEMORY_DAYS = 30;
const MIN_SPREADS_FOR_MEMORY = 3;

const SUIT_RU: Record<string, string> = {
  wands: 'Жезлы',
  cups: 'Кубки',
  swords: 'Мечи',
  pentacles: 'Пентакли',
};
const SUIT_EN: Record<string, string> = {
  wands: 'Wands',
  cups: 'Cups',
  swords: 'Swords',
  pentacles: 'Pentacles',
};
const SUIT_RU_GEN: Record<string, string> = {
  wands: 'Жезлов',
  cups: 'Кубков',
  swords: 'Мечей',
  pentacles: 'Пентаклей',
};

const MAJOR_RU = [
  'Шут', 'Маг', 'Верховная Жрица', 'Императрица', 'Император', 'Иерофант', 'Влюблённые', 'Колесница',
  'Сила', 'Отшельник', 'Колесо Фортуны', 'Справедливость', 'Повешенный', 'Смерть', 'Умеренность',
  'Дьявол', 'Башня', 'Звезда', 'Луна', 'Солнце', 'Суд', 'Мир',
];
const MAJOR_EN = [
  'The Fool', 'The Magician', 'The High Priestess', 'The Empress', 'The Emperor', 'The Hierophant',
  'The Lovers', 'The Chariot', 'Strength', 'The Hermit', 'Wheel of Fortune', 'Justice', 'The Hanged Man',
  'Death', 'Temperance', 'The Devil', 'The Tower', 'The Star', 'The Moon', 'The Sun', 'Judgement', 'The World',
];

function isRu(language: string): boolean {
  return language.toLowerCase().startsWith('ru');
}

type NormCard = {
  id: string;
  /** Старший аркан. */
  major: boolean;
  suit: string | null;
  reversed: boolean;
  /** Ранг младшего аркана 1..14 (11–14 — придворные), null для старших. */
  rank: number | null;
};

function numericId(id: string | undefined): number | null {
  if (!id || !/^\d{1,2}$/.test(id)) return null;
  const n = Number(id);
  return n >= 0 && n <= 77 ? n : null;
}

function normalizeCard(raw: {
  id?: string;
  arcana?: string;
  suit?: string | null;
  direction?: string;
}): NormCard | null {
  const id = raw.id;
  const n = numericId(id);
  if (n == null || id == null) return null;
  const major = raw.arcana ? raw.arcana === 'major' : n < 22;
  return {
    id,
    major,
    suit: major ? null : (raw.suit ?? null),
    reversed: raw.direction === 'reversed' || raw.direction === 'Перевёрнутая',
    rank: major ? null : ((n - 22) % 14) + 1,
  };
}

/** Название карты для промпта (ru — по таблице Старших, младшие — англ. код). */
export function cardLabel(id: string, language: string, fallback?: string): string {
  const n = numericId(id);
  if (n == null) return fallback ?? id;
  if (n < 22) return (isRu(language) ? MAJOR_RU : MAJOR_EN)[n];
  return fallback ?? `#${n}`;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${String(d.getUTCDate()).padStart(2, '0')}.${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/**
 * Блок СТРУКТУРА: считает код, не модель. Без метаданных карт (старый клиент) — пустая строка.
 */
export function buildStructureBlock(positions: InterpretPosition[], language: string): string {
  const ru = isRu(language);
  const cards = positions.map((p) => ({
    pos: p,
    norm: normalizeCard({ id: p.card_id, arcana: p.arcana, suit: p.suit, direction: p.direction }),
  }));
  if (cards.some((c) => !c.norm)) return '';
  const total = cards.length;
  const parts: string[] = [];

  const majors = cards.filter((c) => c.norm!.major);
  const majorNames = majors.map((c) => cardLabel(c.norm!.id, language, c.pos.card));
  parts.push(
    `${ru ? 'Старшие' : 'Major'} ${majors.length}/${total}` + (majors.length ? ` (${majorNames.join(', ')})` : '')
  );

  const suitCount = new Map<string, number>();
  for (const c of cards) {
    const s = c.norm!.suit;
    if (s) suitCount.set(s, (suitCount.get(s) ?? 0) + 1);
  }
  const suitNames = ru ? SUIT_RU : SUIT_EN;
  const suitPart = [...suitCount.entries()].sort((a, b) => b[1] - a[1]).map(([s, n]) => `${suitNames[s] ?? s} ${n}`);
  const missing = Object.keys(suitNames).filter((s) => !suitCount.has(s));
  if (suitPart.length) {
    parts.push(suitPart.join(', ') + (missing.length >= 1 && total >= 4 ? `, ${ru ? 'нет' : 'no'} ${missing.map((s) => (ru ? SUIT_RU_GEN : SUIT_EN)[s]).join(', ')}` : ''));
  }

  const reversed = cards.map((c, i) => (c.norm!.reversed ? i + 1 : 0)).filter(Boolean);
  parts.push(
    `${ru ? 'перевёрнутые' : 'reversed'} ${reversed.length}/${total}` +
      (reversed.length ? ` (${ru ? 'поз.' : 'pos.'} ${reversed.join(',')})` : '')
  );

  const courts = cards.filter((c) => (c.norm!.rank ?? 0) >= 11);
  if (courts.length) {
    parts.push(
      `${ru ? 'придворные' : 'court cards'}: ${courts.map((c) => c.pos.card).join(', ')}`
    );
  }

  const rankCount = new Map<number, number>();
  for (const c of cards) {
    const r = c.norm!.rank;
    if (r != null && r <= 10) rankCount.set(r, (rankCount.get(r) ?? 0) + 1);
  }
  const repeats = [...rankCount.entries()].filter(([, n]) => n >= 2);
  if (repeats.length) {
    parts.push(
      `${ru ? 'повторы чисел' : 'repeated numbers'}: ${repeats
        .map(([r, n]) => `${r === 1 ? (ru ? 'Тузы' : 'Aces') : r} ×${n}`)
        .join(', ')}`
    );
  }

  return `${ru ? 'СТРУКТУРА (посчитано, не пересчитывай)' : 'STRUCTURE (pre-counted, do not recount)'}: ${parts.join('; ')}.`;
}

type PastCard = NormCard & { code?: string; date: string; spreadName: string };

function extractCards(spread: SpreadRecord): PastCard[] {
  const raw = (spread.payload as { selectedCards?: unknown }).selectedCards;
  if (!Array.isArray(raw)) return [];
  const result: PastCard[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const r = item as Record<string, unknown>;
    const norm = normalizeCard({
      id: typeof r.id === 'string' ? r.id : undefined,
      arcana: typeof r.arcana === 'string' ? r.arcana : undefined,
      suit: typeof r.suit === 'string' ? r.suit : null,
      direction: typeof r.direction === 'string' ? r.direction : undefined,
    });
    if (!norm) continue;
    result.push({
      ...norm,
      code: typeof r.code === 'string' ? r.code : undefined,
      date: spread.createdAt,
      spreadName: spread.name,
    });
  }
  return result;
}

function isI18nKey(name: string): boolean {
  return /[:.]/.test(name);
}

function sanitizeText(value: string, max: number): string {
  return value.replace(/[\r\n"«»]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

function moodLine(context: InterpretContext | undefined, language: string): string {
  const m = context?.mood;
  if (!m) return '';
  const ru = isRu(language);
  const vals: string[] = [];
  const num = (v: unknown): number | null =>
    typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 10 ? Math.round(v) : null;
  const mood = num(m.mood);
  const energy = num(m.energy);
  const stress = num(m.stress);
  if (mood != null) vals.push(`${ru ? 'настроение' : 'mood'} ${mood}`);
  if (energy != null) vals.push(`${ru ? 'энергия' : 'energy'} ${energy}`);
  if (stress != null) vals.push(`${ru ? 'стресс' : 'stress'} ${stress}`);
  if (!vals.length) return '';

  let when = ru ? 'недавно' : 'recently';
  if (typeof m.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(m.date)) {
    const days = Math.round((Date.now() - new Date(`${m.date}T12:00:00Z`).getTime()) / MS_DAY);
    if (days < 0 || days > 3) return '';
    when = days <= 0 ? (ru ? 'сегодня' : 'today') : days === 1 ? (ru ? 'вчера' : 'yesterday') : ru ? `${days} дня назад` : `${days} days ago`;
  }
  return `${ru ? 'состояние' : 'state'} ${when}: ${vals.join(', ')} ${ru ? 'из 10' : 'out of 10'}`;
}

function habitsLine(context: InterpretContext | undefined, language: string): string {
  const list = (context?.habits ?? [])
    .filter((h): h is string => typeof h === 'string')
    .map((h) => sanitizeText(h, 60))
    .filter(Boolean)
    .slice(0, 3);
  if (!list.length) return '';
  return `${isRu(language) ? 'привычки' : 'habits'}: ${list.map((h) => `«${h}»`).join(', ')}`;
}

function buildMemoryStats(spreads: SpreadRecord[], positions: InterpretPosition[]): MemoryStats | null {
  if (!spreads.length) return null;
  const past = spreads.flatMap(extractCards);
  const counts = new Map<string, { count: number; lastDate: string }>();
  for (const c of past) {
    const e = counts.get(c.id);
    if (!e) counts.set(c.id, { count: 1, lastDate: c.date });
    else {
      e.count += 1;
      if (new Date(c.date) > new Date(e.lastDate)) e.lastDate = c.date;
    }
  }
  const topCards = [...counts.entries()]
    .filter(([, e]) => e.count >= 2)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([cardId, e]) => ({ cardId, count: e.count }));

  const suitCount = new Map<string, number>();
  for (const c of past) {
    const key = c.suit ?? 'major';
    suitCount.set(key, (suitCount.get(key) ?? 0) + 1);
  }
  const dominant = [...suitCount.entries()].sort((a, b) => b[1] - a[1])[0];
  const total = past.length;

  const seen = new Set<string>();
  const repeats: MemoryStats['repeats'] = [];
  for (const p of positions) {
    if (!p.card_id || seen.has(p.card_id)) continue;
    seen.add(p.card_id);
    const e = counts.get(p.card_id);
    if (e) repeats.push({ cardId: p.card_id, count: e.count, lastDate: e.lastDate });
  }

  return {
    spreadsCount: spreads.length,
    cardsCount: total,
    topCards,
    dominantSuit: dominant && total > 0 ? { suit: dominant[0], pct: Math.round((dominant[1] / total) * 100) } : null,
    reversedPct: total > 0 ? Math.round((past.filter((c) => c.reversed).length / total) * 100) : null,
    repeats,
  };
}

/**
 * Агрегация памяти по раскладам за 30 дней (чистая функция — записи грузит вызывающий).
 * Блок добавляется, только если ≥3 раскладов за месяц или есть настроение.
 */
export function buildSpreadMemory(input: {
  recent: SpreadRecord[];
  positions: InterpretPosition[];
  language: string;
  context?: InterpretContext;
}): SpreadMemory {
  const { recent, positions, language, context } = input;
  const ru = isRu(language);
  const since = Date.now() - MEMORY_DAYS * MS_DAY;
  const spreads = recent.filter((s) => new Date(s.createdAt).getTime() >= since);
  const mood = moodLine(context, language);
  const habits = habitsLine(context, language);
  const enough = spreads.length >= MIN_SPREADS_FOR_MEMORY;
  // Статистику отдаём при любой непустой истории — плашки полезны и до порога памяти в промпте.
  const stats = buildMemoryStats(spreads, positions);
  if (!enough && !mood) return { block: '', note: null, stats };

  const facts: string[] = [];
  let note: MemoryNote | null = null;

  if (enough) {
    const past = spreads.flatMap(extractCards);
    const byId = new Map<string, { count: number; latest: PastCard }>();
    for (const c of past) {
      const e = byId.get(c.id);
      if (!e) byId.set(c.id, { count: 1, latest: c });
      else {
        e.count += 1;
        if (new Date(c.date) > new Date(e.latest.date)) e.latest = c;
      }
    }

    const top = [...byId.values()]
      .filter((e) => e.count >= 2)
      .sort((a, b) => b.count - a.count || new Date(b.latest.date).getTime() - new Date(a.latest.date).getTime())
      .slice(0, 3);
    for (const e of top) {
      const name = cardLabel(e.latest.id, language, e.latest.code);
      const nm = isI18nKey(e.latest.spreadName) ? '' : ` «${sanitizeText(e.latest.spreadName, 40)}»`;
      facts.push(`${name} ${e.count}× ${ru ? 'за 30 дней, последний —' : 'in 30 days, last on'} ${fmtDate(e.latest.date)}${nm}`);
    }

    const suitCount = new Map<string, number>();
    for (const c of past) if (c.suit) suitCount.set(c.suit, (suitCount.get(c.suit) ?? 0) + 1);
    const dominant = [...suitCount.entries()].sort((a, b) => b[1] - a[1])[0];
    const totalPast = past.length;
    if (dominant && totalPast > 0) {
      const pct = Math.round((dominant[1] / totalPast) * 100);
      facts.push(`${(ru ? SUIT_RU : SUIT_EN)[dominant[0]] ?? dominant[0]} ${pct}% ${ru ? 'карт за месяц' : 'of cards this month'}`);
      if (pct >= 35 && totalPast >= 6) {
        note = { kind: 'suit', suit: dominant[0], pct };
      }
    }
    if (totalPast >= 6) {
      const rev = Math.round((past.filter((c) => c.reversed).length / totalPast) * 100);
      facts.push(`${ru ? 'перевёрнутых' : 'reversed'} ${rev}%`);
    }

    // Совпадение текущих карт с прошлыми: берём самое свежее — оно приоритетнее масти.
    let best: PastCard | null = null;
    for (const p of positions) {
      if (!p.card_id) continue;
      for (const c of past) {
        if (c.id !== p.card_id) continue;
        if (!best || new Date(c.date) > new Date(best.date)) best = c;
      }
    }
    if (best) {
      note = { kind: 'card', cardId: best.id, date: best.date, spreadName: best.spreadName };
      const name = cardLabel(best.id, language, best.code);
      const nm = isI18nKey(best.spreadName) ? '' : ` «${sanitizeText(best.spreadName, 40)}»`;
      facts.unshift(`${ru ? 'карта' : 'card'} ${name} ${ru ? 'уже выпадала' : 'came up before'} ${fmtDate(best.date)}${nm}`);
    }
  }

  if (mood) facts.push(mood);
  if (habits) facts.push(habits);
  if (!facts.length) return { block: '', note, stats };

  const head = ru
    ? 'ПАМЯТЬ (используй 1 факт, только если связан с вопросом; ничего не выдумывай)'
    : 'MEMORY (use 1 fact only if it relates to the question; invent nothing)';
  return { block: `${head}: ${facts.join('; ')}.`, note, stats };
}
