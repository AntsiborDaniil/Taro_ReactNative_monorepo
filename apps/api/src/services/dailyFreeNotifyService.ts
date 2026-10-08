import { useMemoryBackend } from '../lib/devMode';
import { getTarotDailyLimit } from '../lib/env';
import { getSupabaseAdmin } from '../lib/supabase';
import {
  buildWebAppDeepLink,
  sendTelegramMessage,
} from '../lib/telegramNotify';

const FLOOD_DELAY_MS = 45;
const BROADCAST_STATE_KEY = 'broadcast_daily_free_v1';
/** Журнал запусков рассылок для админки (bot_notify_state, без отдельной таблицы). */
const NOTIFY_LOG_KEY = 'notify_log_v1';
const NOTIFY_LOG_LIMIT = 50;

export type NotifyLogKind = 'daily_free' | 'broadcast_deploy' | 'broadcast_admin' | 'user_admin';

export type NotifyLogEntry = {
  kind: NotifyLogKind;
  /** ISO-время завершения отправки. */
  at: string;
  sent: number;
  failed: number;
  skipped: number;
  /** Для user_admin — кому отправили. */
  userId?: string;
};

/** In-process журнал для memory-бэкенда (локальный dev без Supabase). */
const memoryNotifyLog: NotifyLogEntry[] = [];

/**
 * Дописать запуск в журнал (последние NOTIFY_LOG_LIMIT записей, новые первыми).
 * Read-modify-write без транзакции: гонка двух одновременных запусков потеряет
 * одну запись журнала — для админской сводки это приемлемо. Ошибка журнала
 * не ломает рассылку.
 */
async function recordNotifyRun(entry: Omit<NotifyLogEntry, 'at'>): Promise<void> {
  const full: NotifyLogEntry = { ...entry, at: new Date().toISOString() };
  if (useMemoryBackend()) {
    memoryNotifyLog.unshift(full);
    memoryNotifyLog.length = Math.min(memoryNotifyLog.length, NOTIFY_LOG_LIMIT);
    return;
  }
  try {
    const admin = getSupabaseAdmin();
    const { data } = await admin.from('bot_notify_state').select('value').eq('key', NOTIFY_LOG_KEY).maybeSingle();
    const prev = Array.isArray((data?.value as { entries?: unknown } | null)?.entries)
      ? ((data?.value as { entries: NotifyLogEntry[] }).entries)
      : [];
    const entries = [full, ...prev].slice(0, NOTIFY_LOG_LIMIT);
    const { error } = await admin
      .from('bot_notify_state')
      .upsert({ key: NOTIFY_LOG_KEY, value: { entries }, updated_at: full.at }, { onConflict: 'key' });
    if (error) console.warn('[dailyFreeNotify] notify log upsert failed:', error.message);
  } catch (logError) {
    console.warn('[dailyFreeNotify] notify log failed:', logError);
  }
}

export type NotifyOverview = {
  entries: NotifyLogEntry[];
  /** Сколько пользователей уже получили «бесплатный расклад доступен» за текущие UTC-сутки. */
  dailyFreeToday: number;
  /** UTC-день слота, к которому относится dailyFreeToday. */
  day: string;
};

/** Сводка для админки: журнал запусков + сколько получили дневное уведомление сегодня. */
export async function getNotifyOverview(): Promise<NotifyOverview> {
  const day = utcToday();
  if (useMemoryBackend()) {
    return { entries: [...memoryNotifyLog], dailyFreeToday: 0, day };
  }
  const admin = getSupabaseAdmin();
  const [{ data: logRow, error: logError }, { count, error: countError }] = await Promise.all([
    admin.from('bot_notify_state').select('value').eq('key', NOTIFY_LOG_KEY).maybeSingle(),
    admin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('daily_free_nudge_sent_on', day),
  ]);
  if (logError) throw logError;
  if (countError) throw countError;
  const entries = (logRow?.value as { entries?: NotifyLogEntry[] } | null)?.entries ?? [];
  return { entries: Array.isArray(entries) ? entries : [], dailyFreeToday: count ?? 0, day };
}

type NotifyLang = 'ru' | 'en';

type ProfileNudgeRow = {
  id: string;
  telegram_id: number;
  daily_free_nudge_sent_on: string | null;
  last_seen_at: string | null;
  spread_credits: number | null;
};

/**
 * Бесплатный слот снова доступен, платных зарядов нет.
 * Совпадает с apps/bot/src/messages.ts (dailyFreeAvailableText).
 */
const DAILY_FREE_RENEWED: Record<NotifyLang, string> = {
  ru: `Какая карта отзовётся тебе сегодня?

Карта дня уже ждёт, а ежедневный ⚡ обновился — хватит на расклад с твоим вопросом.`,
  en: `Which card speaks to you today?

Your card of the day is waiting, and your daily ⚡ has refilled — enough for a reading with your own question.`,
};

/**
 * Есть платные заряды — мягкий хук без упоминания бесплатного слота.
 * Совпадает с apps/bot/src/messages.ts (dailyEngageText).
 */
const DAILY_ENGAGE: Record<NotifyLang, string> = {
  ru: `Минута для себя? Одна карта — один вопрос на сегодня.`,
  en: `A minute for yourself? One card, one question for today.`,
};

/** Тексты совпадают с apps/bot/src/messages.ts (dailyFreeBroadcastText). */
const DAILY_FREE_BROADCAST: Record<NotifyLang, string> = {
  ru: `Что тебе важно заметить сегодня?

Карта дня в Mindful Tarot уже ждёт, а ежедневный ⚡ обновился.`,
  en: `What’s worth noticing today?

Your card of the day in Mindful Tarot is waiting, and your daily ⚡ has refilled.`,
};

const OPEN_APP_LABEL: Record<NotifyLang, string> = {
  ru: '🃏 Карта дня',
  en: '🃏 Card of the day',
};

export type DailyFreeNudgeResult = {
  sent: number;
  skipped: number;
  failed: number;
};

export type BroadcastDailyFreeResult =
  | { alreadyDone: true }
  | { alreadyDone: false; sent: number; failed: number };

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** День слота tarot_daily_usage — как в RPC consume/get (UTC). */
export function utcToday(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Окно отправки nudge: 06:00–18:00 UTC (09:00–21:00 по Москве). */
export function isNudgeWindowOpen(now: Date = new Date()): boolean {
  const hour = now.getUTCHours();
  return hour >= 6 && hour < 18;
}

function resolveLang(_row?: ProfileNudgeRow): NotifyLang {
  // На профиле языка нет — по умолчанию RU.
  return 'ru';
}

function webAppKeyboard(lang: NotifyLang) {
  return {
    inline_keyboard: [
      [
        {
          text: OPEN_APP_LABEL[lang],
          web_app: { url: buildWebAppDeepLink('/', lang) },
        },
      ],
    ],
  };
}

/** Обновляет last_seen_at через RPC. На memory-бэкенде — no-op. */
export async function touchLastSeen(userId: string): Promise<void> {
  if (useMemoryBackend()) {
    return;
  }

  try {
    const admin = getSupabaseAdmin();
    const { error } = await admin.rpc('touch_profile_last_seen', {
      p_user_id: userId,
    });
    if (error) {
      console.warn('[dailyFreeNotify] touch_profile_last_seen failed:', error.message);
    }
  } catch (error) {
    console.warn('[dailyFreeNotify] touchLastSeen error:', error);
  }
}

function paidCreditsOf(row: ProfileNudgeRow): number {
  return typeof row.spread_credits === 'number' && Number.isFinite(row.spread_credits)
    ? Math.max(0, Math.floor(row.spread_credits))
    : 0;
}

function nudgeTextForProfile(
  row: ProfileNudgeRow,
  usedToday: number,
  limit: number,
): string | null {
  const paidCredits = paidCreditsOf(row);
  const freeAvailable = usedToday < limit;
  if (!freeAvailable && paidCredits <= 0) {
    return null;
  }
  const lang = resolveLang(row);
  return paidCredits > 0 ? DAILY_ENGAGE[lang] : DAILY_FREE_RENEWED[lang];
}

/**
 * Как только бесплатный дневной слот снова доступен (новый UTC-день, used < limit):
 * шлём в Telegram «заряд обновился» + кнопку Mini App.
 * Не чаще 1 раза на UTC-сутки (`daily_free_nudge_sent_on` = день слота).
 * Если слот уже потрачен — не шлём (платные заряды сами по себе автонудж не триггерят).
 */
export async function runDailyFreeNudges(): Promise<DailyFreeNudgeResult> {
  if (useMemoryBackend()) {
    return { sent: 0, skipped: 0, failed: 0 };
  }

  // Тихие часы: не шлём с 21:00 до 06:00 по Москве (UTC+3) = вне 06:00–18:00 UTC.
  // Пропущенные ночью остаются кандидатами (daily_free_nudge_sent_on не обновлён)
  // и получат сообщение при первом прогоне после 06:00 UTC.
  if (!isNudgeWindowOpen()) {
    return { sent: 0, skipped: 0, failed: 0 };
  }

  const usageDay = utcToday();
  const limit = getTarotDailyLimit();
  const admin = getSupabaseAdmin();

  const { data, error } = await admin
    .from('profiles')
    .select('id, telegram_id, daily_free_nudge_sent_on, last_seen_at, spread_credits')
    .not('telegram_id', 'is', null)
    .or(
      `daily_free_nudge_sent_on.is.null,daily_free_nudge_sent_on.lt.${usageDay}`,
    );

  if (error) {
    throw error;
  }

  const candidates = (data ?? []) as ProfileNudgeRow[];
  if (candidates.length === 0) {
    return { sent: 0, skipped: 0, failed: 0 };
  }

  const userIds = candidates.map((row) => row.id);
  const usageByUser = new Map<string, number>();

  // Батчами, чтобы не раздувать .in()
  const chunkSize = 200;
  for (let i = 0; i < userIds.length; i += chunkSize) {
    const chunk = userIds.slice(i, i + chunkSize);
    // day в tarot_daily_usage — UTC (как consume_tarot_daily_slot_for_user).
    const { data: usageRows, error: usageError } = await admin
      .from('tarot_daily_usage')
      .select('user_id, count')
      .eq('day', usageDay)
      .in('user_id', chunk);

    if (usageError) {
      throw usageError;
    }

    for (const row of usageRows ?? []) {
      usageByUser.set(
        row.user_id as string,
        typeof row.count === 'number' ? row.count : 0
      );
    }
  }

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of candidates) {
    const used = usageByUser.get(row.id) ?? 0;
    const freeAvailable = used < limit;
    if (!freeAvailable) {
      skipped += 1;
      continue;
    }

    const chatId = Number(row.telegram_id);
    if (!Number.isFinite(chatId) || chatId <= 0) {
      skipped += 1;
      continue;
    }

    const lang = resolveLang(row);
    const text = DAILY_FREE_RENEWED[lang];

    try {
      await sendTelegramMessage({
        chatId,
        text,
        replyMarkup: webAppKeyboard(lang),
      });

      const { error: markError } = await admin
        .from('profiles')
        .update({ daily_free_nudge_sent_on: usageDay })
        .eq('id', row.id);

      if (markError) {
        console.warn(
          '[dailyFreeNotify] mark daily_free_nudge_sent_on failed:',
          markError.message
        );
      }

      sent += 1;
    } catch (sendError) {
      failed += 1;
      console.warn('[dailyFreeNotify] send failed:', sendError);
    }

    await sleep(FLOOD_DELAY_MS);
  }

  // Пустые часовые прогоны в журнал не пишем — только когда были адресаты.
  if (sent + failed > 0) await recordNotifyRun({ kind: 'daily_free', sent, failed, skipped });
  return { sent, skipped, failed };
}

/**
 * Одноразовый broadcast после деплоя (идемпотентность через bot_notify_state).
 */
export async function runBroadcastDailyFreeOnce(): Promise<BroadcastDailyFreeResult> {
  if (useMemoryBackend()) {
    return { alreadyDone: true };
  }

  const admin = getSupabaseAdmin();

  const { data: existing, error: stateError } = await admin
    .from('bot_notify_state')
    .select('key')
    .eq('key', BROADCAST_STATE_KEY)
    .maybeSingle();

  if (stateError) {
    throw stateError;
  }

  if (existing?.key) {
    return { alreadyDone: true };
  }

  const { data: profiles, error: profilesError } = await admin
    .from('profiles')
    .select('id, telegram_id')
    .not('telegram_id', 'is', null);

  if (profilesError) {
    throw profilesError;
  }

  let sent = 0;
  let failed = 0;
  const lang: NotifyLang = 'ru';

  for (const row of profiles ?? []) {
    const chatId = Number(row.telegram_id);
    if (!Number.isFinite(chatId) || chatId <= 0) {
      continue;
    }

    try {
      await sendTelegramMessage({
        chatId,
        text: DAILY_FREE_BROADCAST[lang],
        replyMarkup: webAppKeyboard(lang),
      });
      sent += 1;
    } catch (sendError) {
      failed += 1;
      console.warn('[dailyFreeNotify] broadcast send failed:', sendError);
    }

    await sleep(FLOOD_DELAY_MS);
  }

  const { error: upsertError } = await admin.from('bot_notify_state').upsert(
    {
      key: BROADCAST_STATE_KEY,
      value: {
        sent,
        failed,
        completed_at: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'key' }
  );

  if (upsertError) {
    throw upsertError;
  }

  await recordNotifyRun({ kind: 'broadcast_deploy', sent, failed, skipped: 0 });
  return { alreadyDone: false, sent, failed };
}

export type AdminTelegramNotifyResult = {
  sent: number;
  skipped: number;
  failed: number;
};

/** Ручная отправка nudge одному пользователю (из админки), без проверки last_seen. */
export async function sendTelegramNudgeToUserAdmin(
  userId: string,
): Promise<{ sent: true } | { sent: false; reason: string }> {
  if (useMemoryBackend()) {
    return { sent: false, reason: 'Notify requires Supabase' };
  }

  const admin = getSupabaseAdmin();
  const usageDay = utcToday();
  const limit = getTarotDailyLimit();

  const { data, error } = await admin
    .from('profiles')
    .select('id, telegram_id, daily_free_nudge_sent_on, last_seen_at, spread_credits')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const row = data as ProfileNudgeRow | null;
  if (!row) {
    return { sent: false, reason: 'User not found' };
  }

  const chatId = Number(row.telegram_id);
  if (!Number.isFinite(chatId) || chatId <= 0) {
    return { sent: false, reason: 'No Telegram ID' };
  }

  const { data: usageRow, error: usageError } = await admin
    .from('tarot_daily_usage')
    .select('count')
    .eq('user_id', userId)
    .eq('day', usageDay)
    .maybeSingle();

  if (usageError) {
    throw usageError;
  }

  const used =
    typeof usageRow?.count === 'number' && Number.isFinite(usageRow.count)
      ? usageRow.count
      : 0;
  const text = nudgeTextForProfile(row, used, limit);
  if (!text) {
    return { sent: false, reason: 'No free slot and no paid credits' };
  }

  const lang = resolveLang(row);
  await sendTelegramMessage({
    chatId,
    text,
    replyMarkup: webAppKeyboard(lang),
  });

  await recordNotifyRun({ kind: 'user_admin', sent: 1, failed: 0, skipped: 0, userId });
  return { sent: true };
}

/** Ручная рассылка «бесплатный расклад» всем с telegram_id (из админки). */
export async function sendTelegramBroadcastAdmin(): Promise<AdminTelegramNotifyResult> {
  if (useMemoryBackend()) {
    return { sent: 0, skipped: 0, failed: 0 };
  }

  const admin = getSupabaseAdmin();
  const { data: profiles, error: profilesError } = await admin
    .from('profiles')
    .select('id, telegram_id')
    .not('telegram_id', 'is', null);

  if (profilesError) {
    throw profilesError;
  }

  let sent = 0;
  let failed = 0;
  let skipped = 0;
  const lang: NotifyLang = 'ru';

  for (const row of profiles ?? []) {
    const chatId = Number(row.telegram_id);
    if (!Number.isFinite(chatId) || chatId <= 0) {
      skipped += 1;
      continue;
    }

    try {
      await sendTelegramMessage({
        chatId,
        text: DAILY_FREE_BROADCAST[lang],
        replyMarkup: webAppKeyboard(lang),
      });
      sent += 1;
    } catch (sendError) {
      failed += 1;
      console.warn('[dailyFreeNotify] admin broadcast send failed:', sendError);
    }

    await sleep(FLOOD_DELAY_MS);
  }

  await recordNotifyRun({ kind: 'broadcast_admin', sent, failed, skipped });
  return { sent, skipped, failed };
}
