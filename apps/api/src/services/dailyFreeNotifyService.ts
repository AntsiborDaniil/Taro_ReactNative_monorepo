import * as memory from '../dev/memoryBackend';
import { useMemoryBackend } from '../lib/devMode';
import { getTarotDailyLimit } from '../lib/env';
import { getSupabaseAdmin } from '../lib/supabase';
import { moscowHour, SLOT_RESET_HOUR_MSK, tarotSlotDay } from '../lib/tarotSlotDay';
import {
  buildWebAppDeepLink,
  sendTelegramMessage,
} from '../lib/telegramNotify';
import { pickDailyNudge } from '../lib/dailyNudgeMessages';
import { classifyTelegramSendError, type SendFailure } from '../lib/telegramSendErrors';
import {
  claimNudgeDay,
  getSubscriberLanguage,
  getSubscriberStats,
  listNudgeCandidates,
  markNudgeDelivered,
  markSubscriberBlocked,
  releaseNudgeClaim,
} from './telegramSubscribersService';

/** Лимит Telegram ~30 msg/s; шлём последовательно с запасом. */
export const FLOOD_DELAY_MS = 40;
/** Сколько раз повторяем одно сообщение после 429 (с паузой retry_after). */
const MAX_RATE_LIMIT_RETRIES = 3;
/** Страница кандидатов (keyset по telegram_id: PostgREST режет выборку на 1000 строк). */
const CANDIDATE_PAGE_SIZE = 200;
/** Первые часы после обновления ⚡ шлём ВСЕМ; позже — только тем, кто ещё не потратил слот. */
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
  /** Сколько подписчиков бота получили дневное сообщение за текущий день слота. */
  dailyFreeToday: number;
  /** Всего подписчиков бота и сколько из них заблокировали бота. */
  subscribers?: number;
  blockedSubscribers?: number;
  /** День слота (сутки с 10:00 МСК), к которому относится dailyFreeToday. */
  day: string;
};

/** Сводка для админки: журнал запусков + сколько получили дневное уведомление сегодня. */
export async function getNotifyOverview(): Promise<NotifyOverview> {
  const day = utcToday();
  if (useMemoryBackend()) {
    const stats = await getSubscriberStats(day);
    return {
      entries: [...memoryNotifyLog],
      dailyFreeToday: stats.deliveredToday,
      subscribers: stats.total,
      blockedSubscribers: stats.blocked,
      day,
    };
  }
  const admin = getSupabaseAdmin();
  const [{ data: logRow, error: logError }, stats] = await Promise.all([
    admin.from('bot_notify_state').select('value').eq('key', NOTIFY_LOG_KEY).maybeSingle(),
    getSubscriberStats(day),
  ]);
  if (logError) throw logError;
  const entries = (logRow?.value as { entries?: NotifyLogEntry[] } | null)?.entries ?? [];
  return {
    entries: Array.isArray(entries) ? entries : [],
    dailyFreeToday: stats.deliveredToday,
    subscribers: stats.total,
    blockedSubscribers: stats.blocked,
    day,
  };
}

type NotifyLang = 'ru' | 'en';

type ProfileNudgeRow = {
  id: string;
  telegram_id: number;
  daily_free_nudge_sent_on: string | null;
  last_seen_at: string | null;
  spread_credits: number | null;
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
  /** Подписчики, у которых бот заблокирован/чат недоступен (помечены blocked_at). */
  blocked: number;
};

export type BroadcastDailyFreeResult =
  | { alreadyDone: true }
  | { alreadyDone: false; sent: number; failed: number };

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** День слота tarot_daily_usage — как в RPC consume/get (сутки с 10:00 МСК). */
export function utcToday(): string {
  return tarotSlotDay();
}

/** Окно отправки nudge: с момента обновления ⚡ (10:00 МСК) до 21:00 МСК. */
export function isNudgeWindowOpen(now: Date = new Date()): boolean {
  const hour = moscowHour(now);
  return hour >= SLOT_RESET_HOUR_MSK && hour < 21;
}

/** Как resolveBotLang в apps/bot/src/lang.ts: ru* → ru, остальное → en, нет кода → ru. */
export function resolveNudgeLang(languageCode?: string | null): NotifyLang {
  if (!languageCode) return 'ru';
  const base = languageCode.toLowerCase().split(/[-_]/)[0] ?? '';
  return base === 'ru' ? 'ru' : 'en';
}

/**
 * Шлём, только если бесплатный заряд сейчас есть (не потрачен за день слота).
 * Кто ещё не открывал Mini App (нет профиля) — used = 0: заряд его ждёт.
 */
export function shouldSendNudge(input: { used: number; limit: number }): boolean {
  return input.used < input.limit;
}

function webAppKeyboard(lang: NotifyLang, label: string = OPEN_APP_LABEL[lang]) {
  return {
    inline_keyboard: [
      [
        {
          text: label,
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

export type SendOutcome =
  | { ok: true }
  | { ok: false; failure: SendFailure };

/**
 * Отправка с уважением 429: ждём retry_after и повторяем (до MAX_RATE_LIMIT_RETRIES раз).
 * Остальные ошибки возвращаются классифицированными, без повторов.
 */
export async function sendWithRateLimit(
  send: () => Promise<void>,
  sleepFn: (ms: number) => Promise<void> = sleep,
): Promise<SendOutcome> {
  let failure: SendFailure = { kind: 'retryable' };
  for (let attempt = 0; attempt <= MAX_RATE_LIMIT_RETRIES; attempt += 1) {
    try {
      await send();
      return { ok: true };
    } catch (error) {
      failure = classifyTelegramSendError(error);
      if (failure.kind !== 'rate_limit' || attempt === MAX_RATE_LIMIT_RETRIES) break;
      await sleepFn(failure.retryAfterMs ?? 1000);
    }
  }
  return { ok: false, failure };
}

type RecipientContext = { credits: number; used: number };

/** Платные заряды и расход слота подписчиков страницы (только для тех, у кого есть профиль). */
async function loadRecipientContext(
  telegramIds: number[],
  day: string,
): Promise<Map<number, RecipientContext>> {
  if (useMemoryBackend()) return memory.memoryNudgeContext(telegramIds, day);
  const result = new Map<number, RecipientContext>();
  if (telegramIds.length === 0) return result;
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('profiles')
    .select('id, telegram_id, spread_credits')
    .in('telegram_id', telegramIds);
  if (error) throw error;
  const idByTelegram = new Map<string, number>();
  for (const row of data ?? []) {
    const tg = Number(row.telegram_id);
    result.set(tg, {
      credits: paidCreditsOf({ spread_credits: row.spread_credits } as ProfileNudgeRow),
      used: 0,
    });
    idByTelegram.set(row.id as string, tg);
  }
  if (idByTelegram.size > 0) {
    const { data: usageRows, error: usageError } = await admin
      .from('tarot_daily_usage')
      .select('user_id, count')
      .eq('day', day)
      .in('user_id', [...idByTelegram.keys()]);
    if (usageError) throw usageError;
    for (const u of usageRows ?? []) {
      const tg = idByTelegram.get(u.user_id as string);
      const ctx = tg != null ? result.get(tg) : undefined;
      if (ctx) ctx.used = typeof u.count === 'number' ? u.count : 0;
    }
  }
  return result;
}

const ZERO_RESULT: DailyFreeNudgeResult = { sent: 0, skipped: 0, failed: 0, blocked: 0 };

/**
 * Ежедневная рассылка подписчикам бота (telegram_bot_subscribers) после обновления ⚡ в 10:00 МСК.
 * - Адресаты: не заблокированные, у которых daily_nudge_sent_on < день слота (keyset-страницы).
 * - Идемпотентность: перед отправкой атомарный «захват» дня (conditional UPDATE ... RETURNING);
 *   параллельные прогоны (10:00 + часовой + рестарт) не дадут дублей. Неудача → откат захвата.
 * - Только тем, у кого бесплатный заряд есть (не потрачен за день слота) — и в 10:00, и в догоняющих прогонах.
 * - 403/chat not found → blocked_at; 429 → ждём retry_after; сеть/5xx → остаётся кандидатом.
 */
export async function runDailyFreeNudges(
  options: { now?: Date; sleep?: (ms: number) => Promise<void> } = {},
): Promise<DailyFreeNudgeResult> {
  const now = options.now ?? new Date();
  const sleepFn = options.sleep ?? sleep;

  // До 10:00 МСК новый ⚡ ещё не начислен, после 21:00 — тихие часы.
  if (!isNudgeWindowOpen(now)) return { ...ZERO_RESULT };

  const day = tarotSlotDay(now);
  const limit = getTarotDailyLimit();
  const result: DailyFreeNudgeResult = { ...ZERO_RESULT };

  let afterId = 0;
  for (;;) {
    const page = await listNudgeCandidates({ day, afterId, limit: CANDIDATE_PAGE_SIZE });
    if (page.length === 0) break;
    afterId = page[page.length - 1].telegram_id;

    const ctxById = await loadRecipientContext(
      page.map((r) => Number(r.telegram_id)),
      day,
    );

    for (const row of page) {
      const chatId = Number(row.telegram_id);
      if (!Number.isFinite(chatId) || chatId <= 0) {
        result.skipped += 1;
        continue;
      }
      const ctx = ctxById.get(chatId) ?? { credits: 0, used: 0 };
      if (!shouldSendNudge({ used: ctx.used, limit })) {
        result.skipped += 1;
        continue;
      }

      // Захват дня до отправки: проиграли гонку — значит, другой прогон уже шлёт этому человеку.
      if (!(await claimNudgeDay(chatId, day))) {
        result.skipped += 1;
        continue;
      }

      const lang = resolveNudgeLang(row.language_code);
      const picked = pickDailyNudge({
        lang,
        day,
        recipientKey: String(chatId),
        hasPaidCredits: ctx.credits > 0,
      });
      const outcome = await sendWithRateLimit(
        () =>
          sendTelegramMessage({
            chatId,
            text: picked.text,
            replyMarkup: webAppKeyboard(lang, picked.buttonLabel),
          }),
        sleepFn,
      );

      if (outcome.ok) {
        await markNudgeDelivered(chatId);
        result.sent += 1;
      } else if (outcome.failure.kind === 'blocked') {
        await markSubscriberBlocked(chatId);
        result.blocked += 1;
      } else if (outcome.failure.kind === 'permanent') {
        // Повтор не поможет — день остаётся захваченным, чтобы не долбить каждый час.
        console.warn('[dailyFreeNotify] permanent send failure, chat', chatId);
        result.failed += 1;
      } else {
        // Сеть/5xx/429 — откат захвата: подписчик останется кандидатом догоняющего прогона.
        await releaseNudgeClaim(chatId, day, row.daily_nudge_sent_on);
        result.failed += 1;
      }

      await sleepFn(FLOOD_DELAY_MS);
    }
  }

  // Пустые часовые прогоны в журнал не пишем — только когда были адресаты.
  if (result.sent + result.failed + result.blocked > 0) {
    await recordNotifyRun({
      kind: 'daily_free',
      sent: result.sent,
      failed: result.failed + result.blocked,
      skipped: result.skipped,
    });
  }
  return result;
}

let dailyRunInFlight: Promise<DailyFreeNudgeResult> | null = null;

/**
 * Запуск рассылки в фоне (для HTTP 202). Один прогон на процесс: повторный вызов
 * во время работы не стартует второй (между инстансами защищает захват дня).
 */
export function startDailyFreeNudges(): { started: boolean } {
  if (dailyRunInFlight) return { started: false };
  dailyRunInFlight = runDailyFreeNudges()
    .then((result) => {
      console.log('[dailyFreeNotify] run finished:', result);
      return result;
    })
    .catch((error) => {
      console.error('[dailyFreeNotify] run failed:', error);
      return { ...ZERO_RESULT };
    })
    .finally(() => {
      dailyRunInFlight = null;
    });
  return { started: true };
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
  const paidCredits = paidCreditsOf(row);
  if (used >= limit && paidCredits <= 0) {
    return { sent: false, reason: 'No free slot and no paid credits' };
  }

  const lang = resolveNudgeLang(await getSubscriberLanguage(chatId));
  const picked = pickDailyNudge({
    lang,
    day: usageDay,
    recipientKey: String(chatId),
    hasPaidCredits: paidCredits > 0,
  });
  await sendTelegramMessage({
    chatId,
    text: picked.text,
    replyMarkup: webAppKeyboard(lang, picked.buttonLabel),
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
