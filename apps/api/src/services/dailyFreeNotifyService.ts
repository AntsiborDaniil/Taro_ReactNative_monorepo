import { useMemoryBackend } from '../lib/devMode';
import { getTarotDailyLimit } from '../lib/env';
import { getSupabaseAdmin } from '../lib/supabase';
import {
  buildWebAppDeepLink,
  sendTelegramMessage,
} from '../lib/telegramNotify';

const MOSCOW_TZ = 'Europe/Moscow';
const FLOOD_DELAY_MS = 45;
const BROADCAST_STATE_KEY = 'broadcast_daily_free_v1';

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
  ru: `Погадаем сегодня?

Бесплатный расклад снова доступен — дневной заряд обновился. Загляни в приложение.`,
  en: `Shall we do a reading today?

Your free daily spread is back — the free slot has refreshed. Open the app.`,
};

/**
 * Есть платные заряды — мягкий хук без упоминания бесплатного слота.
 * Совпадает с apps/bot/src/messages.ts (dailyEngageText).
 */
const DAILY_ENGAGE: Record<NotifyLang, string> = {
  ru: `Погадаем сегодня?

Открой Mindful Tarot — карты уже ждут.`,
  en: `Shall we do a reading today?

Open Mindful Tarot — the cards are waiting.`,
};

/** Тексты совпадают с apps/bot/src/messages.ts (dailyFreeBroadcastText). */
const DAILY_FREE_BROADCAST: Record<NotifyLang, string> = {
  ru: `Погадаем сегодня?

В Mindful Tarot каждый день есть бесплатный расклад с толкованием — заряд уже обновился.`,
  en: `Shall we do a reading today?

Mindful Tarot gives you a free reading every day — your free slot is ready.`,
};

const OPEN_APP_LABEL: Record<NotifyLang, string> = {
  ru: '🔮 Погадаем',
  en: '🔮 Let’s read',
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

/** Календарная дата YYYY-MM-DD в Europe/Moscow. */
export function moscowToday(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: MOSCOW_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/** День слота tarot_daily_usage — как в RPC consume/get (UTC). */
export function utcToday(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Начало московских суток (00:00 MSK) как ISO timestamptz. */
export function startOfMoscowDayIso(day: string): string {
  return new Date(`${day}T00:00:00+03:00`).toISOString();
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
          web_app: { url: buildWebAppDeepLink('/spreads', lang) },
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

/**
 * Напоминания тем, кто не заходил сегодня (МСК):
 * — нет платных зарядов + бесплатный слот свободен → «заряд обновился» + погадаем;
 * — есть платные заряды → мягкое «погадаем сегодня?» (без про бесплатный слот);
 * — нет платных и слот уже потрачен → не шлём.
 */
export async function runDailyFreeNudges(): Promise<DailyFreeNudgeResult> {
  if (useMemoryBackend()) {
    return { sent: 0, skipped: 0, failed: 0 };
  }

  const today = moscowToday();
  const usageDay = utcToday();
  const dayStartIso = startOfMoscowDayIso(today);
  const limit = getTarotDailyLimit();
  const admin = getSupabaseAdmin();

  const { data, error } = await admin
    .from('profiles')
    .select('id, telegram_id, daily_free_nudge_sent_on, last_seen_at, spread_credits')
    .not('telegram_id', 'is', null)
    .or(`daily_free_nudge_sent_on.is.null,daily_free_nudge_sent_on.lt.${today}`)
    .or(`last_seen_at.is.null,last_seen_at.lt.${dayStartIso}`);

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
    // day в tarot_daily_usage — UTC (как consume_tarot_daily_slot_for_user), не МСК.
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
    const paidCredits =
      typeof row.spread_credits === 'number' && Number.isFinite(row.spread_credits)
        ? Math.max(0, Math.floor(row.spread_credits))
        : 0;
    const freeAvailable = used < limit;

    // Без платных и бесплатный слот уже съеден — нечего предлагать.
    if (!freeAvailable && paidCredits <= 0) {
      skipped += 1;
      continue;
    }

    const chatId = Number(row.telegram_id);
    if (!Number.isFinite(chatId) || chatId <= 0) {
      skipped += 1;
      continue;
    }

    const lang = resolveLang(row);
    // Платные есть → только «погадаем»; иначе (бесплатный слот свободен) — про обновление заряда.
    const text =
      paidCredits > 0 ? DAILY_ENGAGE[lang] : DAILY_FREE_RENEWED[lang];

    try {
      await sendTelegramMessage({
        chatId,
        text,
        replyMarkup: webAppKeyboard(lang),
      });

      const { error: markError } = await admin
        .from('profiles')
        .update({ daily_free_nudge_sent_on: today })
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

  return { alreadyDone: false, sent, failed };
}
