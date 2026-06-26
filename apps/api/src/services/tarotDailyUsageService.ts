import { useMemoryBackend } from '../lib/devMode';
import * as memory from '../dev/memoryBackend';
import { getSupabaseAdmin } from '../lib/supabase';
import { getTarotDailyLimit } from '../lib/env';

export type TarotDailyUsage = {
  used: number;
  limit: number;
  day: string;
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

export async function tryConsumeTarotDailySlot(
  userId: string
): Promise<
  | { ok: true; used: number; limit: number; day: string }
  | { ok: false; used: number; limit: number; day: string }
> {
  const usage = await loadTarotDailyUsage(userId);
  return {
    ok: true,
    used: usage.used,
    limit: usage.limit,
    day: usage.day,
  };
}

export async function isTarotDailyLimitReached(
  userId: string
): Promise<boolean> {
  const usage = await loadTarotDailyUsage(userId);
  return usage.used >= usage.limit;
}
