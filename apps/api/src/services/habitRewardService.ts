import * as memory from '../dev/memoryBackend';
import { useMemoryBackend } from '../lib/devMode';
import { getSupabaseAdmin } from '../lib/supabase';

/** Награда за закрытую неделю целей. */
export const HABIT_WEEK_REWARD_CREDITS = 1;
/**
 * Нижняя граница «разных дней с отметками» для награды: клиент присылает своё
 * число нужных дней (по расписанию привычек), но не меньше этого — иначе
 * неделю можно «закрыть» за один вечер.
 */
export const HABIT_WEEK_MIN_DAYS = 3;
const MAX_DAYS = 7;
const TIME_ZONE = 'Europe/Moscow';

/** День по серверным часам в Europe/Moscow — YYYY-MM-DD. Часы устройства не участвуют. */
export function serverDay(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

/** Понедельник текущей недели (Europe/Moscow) — YYYY-MM-DD. */
export function serverWeekStart(now = new Date()): string {
  const day = serverDay(now);
  const date = new Date(`${day}T00:00:00Z`);
  const weekday = (date.getUTCDay() + 6) % 7; // 0 = понедельник
  date.setUTCDate(date.getUTCDate() - weekday);
  return date.toISOString().slice(0, 10);
}

export type HabitWeekStatus = {
  weekStart: string;
  /** Разных дней с отметками на этой неделе (по серверу). */
  daysWithCheckins: number;
  claimed: boolean;
  minDays: number;
  credits: number;
};

/** Отметка «за сегодня» (done) или её снятие. День — серверный. */
export async function setHabitCheckin(userId: string, habitId: string, done: boolean): Promise<void> {
  const day = serverDay();
  if (useMemoryBackend()) {
    memory.memorySetHabitCheckin(userId, habitId, day, done);
    return;
  }
  const admin = getSupabaseAdmin();
  if (done) {
    const { error } = await admin
      .from('habit_checkins')
      .upsert({ user_id: userId, habit_id: habitId, day }, { onConflict: 'user_id,habit_id,day', ignoreDuplicates: true });
    if (error) throw error;
    return;
  }
  const { error } = await admin.from('habit_checkins').delete().match({ user_id: userId, habit_id: habitId, day });
  if (error) throw error;
}

export async function getHabitWeekStatus(userId: string): Promise<HabitWeekStatus> {
  const weekStart = serverWeekStart();
  if (useMemoryBackend()) {
    const s = memory.memoryGetHabitWeek(userId, weekStart);
    return { weekStart, ...s, minDays: HABIT_WEEK_MIN_DAYS, credits: HABIT_WEEK_REWARD_CREDITS };
  }
  const admin = getSupabaseAdmin();
  const weekEnd = new Date(`${weekStart}T00:00:00Z`);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);
  const [{ data: rows, error }, { data: reward, error: rewardError }] = await Promise.all([
    admin
      .from('habit_checkins')
      .select('day')
      .eq('user_id', userId)
      .gte('day', weekStart)
      .lt('day', weekEnd.toISOString().slice(0, 10)),
    admin.from('habit_week_rewards').select('week_start').eq('user_id', userId).eq('week_start', weekStart).maybeSingle(),
  ]);
  if (error) throw error;
  if (rewardError) throw rewardError;
  const days = new Set((rows ?? []).map((r) => String(r.day)));
  return {
    weekStart,
    daysWithCheckins: days.size,
    claimed: Boolean(reward),
    minDays: HABIT_WEEK_MIN_DAYS,
    credits: HABIT_WEEK_REWARD_CREDITS,
  };
}

export type ClaimResult = {
  status: 'granted' | 'already' | 'not_enough_days';
  spreadCredits: number;
  daysWithCheckins: number;
  requiredDays: number;
};

/** Забрать награду недели: атомарно (RPC claim_habit_week_reward), не чаще раза в неделю. */
export async function claimHabitWeekReward(userId: string, clientRequiredDays: number): Promise<ClaimResult> {
  const requiredDays = Math.min(MAX_DAYS, Math.max(HABIT_WEEK_MIN_DAYS, Math.floor(clientRequiredDays) || 0));
  const weekStart = serverWeekStart();
  if (useMemoryBackend()) {
    return { ...memory.memoryClaimHabitWeekReward(userId, weekStart, requiredDays, HABIT_WEEK_REWARD_CREDITS), requiredDays };
  }
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.rpc('claim_habit_week_reward', {
    p_user_id: userId,
    p_week_start: weekStart,
    p_required_days: requiredDays,
    p_credits: HABIT_WEEK_REWARD_CREDITS,
  });
  if (error) throw error;
  const row = (Array.isArray(data) ? data[0] : data) as
    | { out_status: ClaimResult['status']; out_spread_credits: number; out_days: number }
    | undefined;
  if (!row) throw new Error('claim_habit_week_reward returned no row');
  return {
    status: row.out_status,
    spreadCredits: row.out_spread_credits ?? 0,
    daysWithCheckins: row.out_days ?? 0,
    requiredDays,
  };
}
