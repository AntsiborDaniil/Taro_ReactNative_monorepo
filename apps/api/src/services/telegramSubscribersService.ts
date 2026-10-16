import { useMemoryBackend } from '../lib/devMode';
import { getSupabaseAdmin } from '../lib/supabase';
import { tarotSlotDay } from '../lib/tarotSlotDay';

/** Что произошло с подписчиком. */
export type SubscriberEvent =
  /** /start или любое сообщение боту: диалог открыт, снимаем blocked. */
  | 'interaction'
  /** my_chat_member: kicked — бот заблокирован. */
  | 'blocked'
  /** my_chat_member: member — разблокировал. */
  | 'unblocked'
  /** Вход в Mini App через Telegram: диалог с ботом мог и не начинаться — blocked не трогаем. */
  | 'miniapp';

export const SUBSCRIBER_EVENTS: readonly SubscriberEvent[] = [
  'interaction',
  'blocked',
  'unblocked',
  'miniapp',
];

export type SubscriberRow = {
  telegram_id: number;
  language_code: string | null;
  blocked_at: string | null;
  daily_nudge_sent_on: string | null;
  last_nudge_at: string | null;
};

/** Реестр memory-бэкенда (локальный dev без Supabase). */
const memorySubscribers = new Map<number, SubscriberRow>();

/**
 * Зафиксировать событие подписчика (upsert). Новый подписчик сразу помечается как
 * «получил рассылку за сегодня»: он только что пришёл и увидел приветствие, первое
 * сообщение рассылки получит со следующего дня слота.
 */
export async function recordSubscriberEvent(input: {
  telegramId: number;
  event: SubscriberEvent;
  languageCode?: string | null;
}): Promise<void> {
  const { telegramId, event } = input;
  const lang = input.languageCode?.trim() || null;
  const now = new Date().toISOString();
  const today = tarotSlotDay();

  if (useMemoryBackend()) {
    const row = memorySubscribers.get(telegramId) ?? {
      telegram_id: telegramId,
      language_code: lang,
      blocked_at: null,
      daily_nudge_sent_on: today,
      last_nudge_at: null,
    };
    if (lang) row.language_code = lang;
    if (event === 'blocked') row.blocked_at = now;
    if (event === 'interaction' || event === 'unblocked') row.blocked_at = null;
    memorySubscribers.set(telegramId, row);
    return;
  }

  const admin = getSupabaseAdmin();
  // 1) Вставка только если строки нет (ignoreDuplicates), чтобы не перетереть daily_nudge_sent_on.
  const { error: insertError } = await admin.from('telegram_bot_subscribers').upsert(
    {
      telegram_id: telegramId,
      language_code: lang,
      daily_nudge_sent_on: today,
      ...(event === 'blocked' ? { blocked_at: now } : {}),
    },
    { onConflict: 'telegram_id', ignoreDuplicates: true },
  );
  if (insertError) throw insertError;

  // 2) Обновление существующей строки.
  const patch: Record<string, unknown> = {};
  if (lang) patch.language_code = lang;
  if (event === 'interaction') {
    patch.last_interaction_at = now;
    patch.blocked_at = null;
  } else if (event === 'unblocked') {
    patch.blocked_at = null;
  } else if (event === 'blocked') {
    patch.blocked_at = now;
  }
  if (Object.keys(patch).length === 0) return;
  const { error } = await admin.from('telegram_bot_subscribers').update(patch).eq('telegram_id', telegramId);
  if (error) throw error;
}

/** Не бросает: сбой реестра не должен ломать вход в Mini App. */
export async function recordSubscriberEventSafe(
  input: Parameters<typeof recordSubscriberEvent>[0],
): Promise<void> {
  try {
    await recordSubscriberEvent(input);
  } catch (error) {
    console.warn('[telegramSubscribers] record failed:', error);
  }
}

/** Страница кандидатов рассылки: не заблокированные, ещё не захваченные за day, id > afterId. */
export async function listNudgeCandidates(input: {
  day: string;
  afterId: number;
  limit: number;
}): Promise<SubscriberRow[]> {
  if (useMemoryBackend()) {
    return [...memorySubscribers.values()]
      .filter(
        (r) =>
          !r.blocked_at &&
          r.telegram_id > input.afterId &&
          (!r.daily_nudge_sent_on || r.daily_nudge_sent_on < input.day),
      )
      .sort((a, b) => a.telegram_id - b.telegram_id)
      .slice(0, input.limit)
      .map((r) => ({ ...r })); // копии: захват не должен менять уже прочитанную строку
  }
  const { data, error } = await getSupabaseAdmin()
    .from('telegram_bot_subscribers')
    .select('telegram_id, language_code, blocked_at, daily_nudge_sent_on, last_nudge_at')
    .is('blocked_at', null)
    .or(`daily_nudge_sent_on.is.null,daily_nudge_sent_on.lt.${input.day}`)
    .gt('telegram_id', input.afterId)
    .order('telegram_id', { ascending: true })
    .limit(input.limit);
  if (error) throw error;
  return (data ?? []) as SubscriberRow[];
}

/**
 * Атомарный «захват» дня: UPDATE ... WHERE sent_on is distinct from day RETURNING.
 * true — строку захватили мы (можно слать); false — другой прогон уже взял / заблокирован.
 */
export async function claimNudgeDay(telegramId: number, day: string): Promise<boolean> {
  if (useMemoryBackend()) {
    const row = memorySubscribers.get(telegramId);
    if (!row || row.blocked_at) return false;
    if (row.daily_nudge_sent_on && row.daily_nudge_sent_on >= day) return false;
    row.daily_nudge_sent_on = day;
    return true;
  }
  const { data, error } = await getSupabaseAdmin()
    .from('telegram_bot_subscribers')
    .update({ daily_nudge_sent_on: day })
    .eq('telegram_id', telegramId)
    .is('blocked_at', null)
    .or(`daily_nudge_sent_on.is.null,daily_nudge_sent_on.lt.${day}`)
    .select('telegram_id');
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

/** Откат захвата при неудачной отправке: строка снова кандидат догоняющего прогона. */
export async function releaseNudgeClaim(
  telegramId: number,
  day: string,
  previous: string | null,
): Promise<void> {
  if (useMemoryBackend()) {
    const row = memorySubscribers.get(telegramId);
    if (row && row.daily_nudge_sent_on === day) row.daily_nudge_sent_on = previous;
    return;
  }
  const { error } = await getSupabaseAdmin()
    .from('telegram_bot_subscribers')
    .update({ daily_nudge_sent_on: previous })
    .eq('telegram_id', telegramId)
    .eq('daily_nudge_sent_on', day);
  if (error) console.warn('[telegramSubscribers] release claim failed:', error.message);
}

export async function markNudgeDelivered(telegramId: number): Promise<void> {
  const now = new Date().toISOString();
  if (useMemoryBackend()) {
    const row = memorySubscribers.get(telegramId);
    if (row) row.last_nudge_at = now;
    return;
  }
  const { error } = await getSupabaseAdmin()
    .from('telegram_bot_subscribers')
    .update({ last_nudge_at: now })
    .eq('telegram_id', telegramId);
  if (error) console.warn('[telegramSubscribers] mark delivered failed:', error.message);
}

/** Бот заблокирован — больше не слать (и снять захват не нужно: blocked исключает из выборки). */
export async function markSubscriberBlocked(telegramId: number): Promise<void> {
  const now = new Date().toISOString();
  if (useMemoryBackend()) {
    const row = memorySubscribers.get(telegramId);
    if (row) row.blocked_at = now;
    return;
  }
  const { error } = await getSupabaseAdmin()
    .from('telegram_bot_subscribers')
    .update({ blocked_at: now })
    .eq('telegram_id', telegramId);
  if (error) console.warn('[telegramSubscribers] mark blocked failed:', error.message);
}

/** Язык подписчика для админских отправок (нет записи → null). */
export async function getSubscriberLanguage(telegramId: number): Promise<string | null> {
  if (useMemoryBackend()) return memorySubscribers.get(telegramId)?.language_code ?? null;
  const { data } = await getSupabaseAdmin()
    .from('telegram_bot_subscribers')
    .select('language_code')
    .eq('telegram_id', telegramId)
    .maybeSingle();
  return (data?.language_code as string | null | undefined) ?? null;
}

export type SubscriberStats = { total: number; blocked: number; deliveredToday: number };

/** Сводка для админки. deliveredToday — сообщения, ушедшие с начала суток слота (10:00 МСК). */
export async function getSubscriberStats(day: string): Promise<SubscriberStats> {
  const slotStartIso = `${day}T07:00:00.000Z`;
  if (useMemoryBackend()) {
    const rows = [...memorySubscribers.values()];
    return {
      total: rows.length,
      blocked: rows.filter((r) => r.blocked_at).length,
      deliveredToday: rows.filter((r) => r.last_nudge_at && r.last_nudge_at >= slotStartIso).length,
    };
  }
  const admin = getSupabaseAdmin();
  const head = { count: 'exact' as const, head: true };
  const [total, blocked, delivered] = await Promise.all([
    admin.from('telegram_bot_subscribers').select('telegram_id', head),
    admin.from('telegram_bot_subscribers').select('telegram_id', head).not('blocked_at', 'is', null),
    admin.from('telegram_bot_subscribers').select('telegram_id', head).gte('last_nudge_at', slotStartIso),
  ]);
  for (const r of [total, blocked, delivered]) if (r.error) throw r.error;
  return {
    total: total.count ?? 0,
    blocked: blocked.count ?? 0,
    deliveredToday: delivered.count ?? 0,
  };
}
