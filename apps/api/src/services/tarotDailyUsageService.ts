import { useMemoryBackend } from '../lib/devMode';
import * as memory from '../dev/memoryBackend';
import { getSupabaseAdmin } from '../lib/supabase';
import { getTarotDailyLimit } from '../lib/env';

export type TarotDailyUsage = {
  used: number;
  limit: number;
  day: string;
};

export type SpreadSlotSource = 'daily' | 'credit';

export type SpreadSlotResult =
  | {
      ok: true;
      used: number;
      limit: number;
      day: string;
      source: SpreadSlotSource;
      spreadCredits: number;
    }
  | {
      ok: false;
      used: number;
      limit: number;
      day: string;
      spreadCredits: number;
    };

type RpcUsageRow = {
  used: number;
  limit: number;
  day: string;
  ok?: boolean;
};

export function getTarotDailyUsage(userId: string): Promise<TarotDailyUsage> {
  return loadTarotDailyUsage(userId);
}

async function loadTarotDailyUsage(userId: string): Promise<TarotDailyUsage> {
  if (useMemoryBackend()) {
    return memory.memoryGetTarotDailyUsage(userId);
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin.rpc('get_tarot_daily_usage_for_user', {
    p_user_id: userId,
    p_limit: getTarotDailyLimit(),
  });

  if (error) {
    throw error;
  }

  const row = data as RpcUsageRow;
  return {
    used: row.used,
    limit: row.limit,
    day: String(row.day),
  };
}

export async function getSpreadCredits(userId: string): Promise<number> {
  if (useMemoryBackend()) {
    return memory.memoryGetSpreadCredits(userId);
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin.rpc('get_spread_credits_for_user', {
    p_user_id: userId,
  });

  if (error) {
    throw error;
  }

  return typeof data === 'number' ? data : 0;
}

export async function tryConsumeTarotDailySlot(
  userId: string
): Promise<
  | { ok: true; used: number; limit: number; day: string }
  | { ok: false; used: number; limit: number; day: string }
> {
  if (useMemoryBackend()) {
    return memory.memoryTryConsumeTarotDailySlot(userId);
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin.rpc('consume_tarot_daily_slot_for_user', {
    p_user_id: userId,
    p_limit: getTarotDailyLimit(),
  });

  if (error) {
    throw error;
  }

  const row = data as RpcUsageRow;
  if (row.ok === false) {
    return {
      ok: false,
      used: row.used,
      limit: row.limit,
      day: String(row.day),
    };
  }

  return {
    ok: true,
    used: row.used,
    limit: row.limit,
    day: String(row.day),
  };
}

/** Daily free slot first; then paid spread_credits. */
export async function tryConsumeSpreadSlot(
  userId: string
): Promise<SpreadSlotResult> {
  const daily = await tryConsumeTarotDailySlot(userId);
  if (daily.ok) {
    const spreadCredits = await getSpreadCredits(userId);
    return {
      ok: true,
      used: daily.used,
      limit: daily.limit,
      day: daily.day,
      source: 'daily',
      spreadCredits,
    };
  }

  if (useMemoryBackend()) {
    const credit = memory.memoryConsumeSpreadCredit(userId);
    if (credit.ok) {
      return {
        ok: true,
        used: daily.used,
        limit: daily.limit,
        day: daily.day,
        source: 'credit',
        spreadCredits: credit.spreadCredits,
      };
    }
    return {
      ok: false,
      used: daily.used,
      limit: daily.limit,
      day: daily.day,
      spreadCredits: credit.spreadCredits,
    };
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin.rpc('consume_spread_credit_for_user', {
    p_user_id: userId,
  });

  if (error) {
    throw error;
  }

  const row = Array.isArray(data) ? data[0] : data;
  const ok = Boolean(row?.ok);
  const spreadCredits =
    typeof row?.spread_credits === 'number' ? row.spread_credits : 0;

  if (ok) {
    return {
      ok: true,
      used: daily.used,
      limit: daily.limit,
      day: daily.day,
      source: 'credit',
      spreadCredits,
    };
  }

  return {
    ok: false,
    used: daily.used,
    limit: daily.limit,
    day: daily.day,
    spreadCredits,
  };
}

/** Undo a consumed slot when OpenAI (or another provider) fails after consume. */
export async function refundTarotDailySlot(userId: string): Promise<void> {
  if (useMemoryBackend()) {
    memory.memoryRefundTarotDailySlot(userId);
    return;
  }

  const admin = getSupabaseAdmin();
  const day = new Date().toISOString().slice(0, 10);
  const { data, error } = await admin
    .from('tarot_daily_usage')
    .select('count')
    .eq('user_id', userId)
    .eq('day', day)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const used = typeof data?.count === 'number' ? data.count : 0;
  if (used <= 0) {
    return;
  }

  const { error: updateError } = await admin
    .from('tarot_daily_usage')
    .update({ count: used - 1 })
    .eq('user_id', userId)
    .eq('day', day);

  if (updateError) {
    throw updateError;
  }
}

export async function refundSpreadSlot(
  userId: string,
  source: SpreadSlotSource
): Promise<void> {
  if (source === 'daily') {
    await refundTarotDailySlot(userId);
    return;
  }

  if (useMemoryBackend()) {
    memory.memoryRefundSpreadCredit(userId);
    return;
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin.rpc('refund_spread_credit_for_user', {
    p_user_id: userId,
  });

  if (error) {
    throw error;
  }
}

export async function isTarotDailyLimitReached(
  userId: string
): Promise<boolean> {
  const usage = await loadTarotDailyUsage(userId);
  if (usage.used < usage.limit) {
    return false;
  }
  const credits = await getSpreadCredits(userId);
  return credits <= 0;
}
