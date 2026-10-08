import * as memory from '../dev/memoryBackend';
import { useMemoryBackend } from '../lib/devMode';
import { getSupabaseAdmin } from '../lib/supabase';

/** Бесплатные карты периода: по одной на день / неделю / месяц (Europe/Moscow). */
export type FreePeriodKind = 'day' | 'week' | 'month';

export const FREE_PERIOD_KINDS: FreePeriodKind[] = ['day', 'week', 'month'];

/** Каталожные id раскладов (lowercase) → период. */
const KIND_BY_SPREAD_KEY: Record<string, FreePeriodKind> = {
  simple_daysuggest: 'day',
  period_weekcard: 'week',
  period_monthcard: 'month',
};

export function freePeriodKindOf(spreadKey: string | undefined): FreePeriodKind | null {
  return KIND_BY_SPREAD_KEY[(spreadKey ?? '').toLowerCase()] ?? null;
}

const TIME_ZONE = 'Europe/Moscow';
/** Москва без перехода на летнее время — UTC+3. */
const MOSCOW_OFFSET_MS = 3 * 60 * 60 * 1000;
/** Запись «в работе» старше этого — сбой без release: считаем свободной. */
const STALE_PENDING_MS = 3 * 60 * 1000;

function moscowParts(now: Date): { y: number; m: number; d: number; weekday: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return { y: Number(get('year')), m: Number(get('month')), d: Number(get('day')), weekday: weekdays.indexOf(get('weekday')) };
}

function iso(y: number, m: number, d: number): string {
  return new Date(Date.UTC(y, m - 1, d)).toISOString().slice(0, 10);
}

/** Начало текущего периода (YYYY-MM-DD, Europe/Moscow) — часы устройства не участвуют. */
export function periodStart(kind: FreePeriodKind, now = new Date()): string {
  const { y, m, d, weekday } = moscowParts(now);
  if (kind === 'day') return iso(y, m, d);
  if (kind === 'week') return iso(y, m, d - weekday);
  return iso(y, m, 1);
}

/** Когда откроется следующая карта этого типа — UTC ISO (00:00 по Москве). */
export function nextPeriodAt(kind: FreePeriodKind, now = new Date()): string {
  const start = new Date(`${periodStart(kind, now)}T00:00:00Z`);
  if (kind === 'day') start.setUTCDate(start.getUTCDate() + 1);
  else if (kind === 'week') start.setUTCDate(start.getUTCDate() + 7);
  else start.setUTCMonth(start.getUTCMonth() + 1);
  return new Date(start.getTime() - MOSCOW_OFFSET_MS).toISOString();
}

export type FreePeriodPayload = {
  interpretation: string;
  card: { card_id?: string; card: string; direction: string };
};

export type FreePeriodClaim =
  | { ok: true; periodStart: string }
  | { ok: false; periodStart: string; saved: FreePeriodPayload | null };

/**
 * Занять карту периода ДО вызова модели: вставка с уникальным ключом
 * (user, kind, period_start). Конфликт — карта уже открыта (или в работе).
 */
export async function claimFreePeriodCard(userId: string, kind: FreePeriodKind): Promise<FreePeriodClaim> {
  const start = periodStart(kind);
  if (useMemoryBackend()) {
    return memory.memoryClaimFreePeriodCard(userId, kind, start, STALE_PENDING_MS);
  }
  const admin = getSupabaseAdmin();
  const { error } = await admin.from('free_period_cards').insert({ user_id: userId, kind, period_start: start });
  if (!error) return { ok: true, periodStart: start };
  if (error.code !== '23505') throw error;

  const { data: row, error: readError } = await admin
    .from('free_period_cards')
    .select('payload, created_at')
    .match({ user_id: userId, kind, period_start: start })
    .maybeSingle();
  if (readError) throw readError;
  const payload = (row?.payload ?? null) as FreePeriodPayload | null;
  // Зависшая «в работе» запись (сервер упал между claim и ответом) — освобождаем и занимаем заново.
  if (!payload && row && Date.now() - new Date(row.created_at as string).getTime() > STALE_PENDING_MS) {
    await admin
      .from('free_period_cards')
      .update({ created_at: new Date().toISOString() })
      .match({ user_id: userId, kind, period_start: start })
      .is('payload', null);
    return { ok: true, periodStart: start };
  }
  return { ok: false, periodStart: start, saved: payload };
}

/** Модель ответила — сохраняем карту периода. */
export async function completeFreePeriodCard(
  userId: string,
  kind: FreePeriodKind,
  start: string,
  payload: FreePeriodPayload,
): Promise<void> {
  if (useMemoryBackend()) {
    memory.memoryCompleteFreePeriodCard(userId, kind, start, payload);
    return;
  }
  const { error } = await getSupabaseAdmin()
    .from('free_period_cards')
    .update({ payload })
    .match({ user_id: userId, kind, period_start: start });
  if (error) throw error;
}

/** Модель не ответила — освобождаем период (только «в работе», готовую не трогаем). */
export async function releaseFreePeriodCard(userId: string, kind: FreePeriodKind, start: string): Promise<void> {
  if (useMemoryBackend()) {
    memory.memoryReleaseFreePeriodCard(userId, kind, start);
    return;
  }
  const { error } = await getSupabaseAdmin()
    .from('free_period_cards')
    .delete()
    .match({ user_id: userId, kind, period_start: start })
    .is('payload', null);
  if (error) throw error;
}

export type FreePeriodStatus = {
  kind: FreePeriodKind;
  periodStart: string;
  available: boolean;
  nextAt: string;
  saved: FreePeriodPayload | null;
};

/** Статус всех трёх карт для клиента (доступна ли, когда следующая, сохранённая карта). */
export async function getFreePeriodStatus(userId: string): Promise<FreePeriodStatus[]> {
  const starts = Object.fromEntries(FREE_PERIOD_KINDS.map((k) => [k, periodStart(k)])) as Record<FreePeriodKind, string>;
  let rows: Array<{ kind: FreePeriodKind; period_start: string; payload: FreePeriodPayload | null }>;
  if (useMemoryBackend()) {
    rows = memory.memoryListFreePeriodCards(userId);
  } else {
    const { data, error } = await getSupabaseAdmin()
      .from('free_period_cards')
      .select('kind, period_start, payload')
      .eq('user_id', userId)
      .gte('period_start', starts.month < starts.week ? starts.month : starts.week);
    if (error) throw error;
    rows = (data ?? []) as typeof rows;
  }
  return FREE_PERIOD_KINDS.map((kind) => {
    const row = rows.find((r) => r.kind === kind && String(r.period_start) === starts[kind]);
    return {
      kind,
      periodStart: starts[kind],
      available: !row,
      nextAt: nextPeriodAt(kind),
      saved: row?.payload ?? null,
    };
  });
}
