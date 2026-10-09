/**
 * Бесплатный дневной ⚡ обновляется в 10:00 по Москве.
 * «День слота» — дата начала суток 10:00–10:00 МСК; формула совпадает с
 * public.tarot_slot_day() (миграция 20261012120000_daily_slot_10_msk.sql).
 * Москва живёт в UTC+3 без перевода часов, так что граница — ровно 07:00 UTC.
 */
export const SLOT_RESET_HOUR_MSK = 10;
const MSK_OFFSET_HOURS = 3;
const SLOT_SHIFT_MS = (SLOT_RESET_HOUR_MSK - MSK_OFFSET_HOURS) * 60 * 60 * 1000;

/** День слота (YYYY-MM-DD), как tarot_daily_usage.day. */
export function tarotSlotDay(now: Date = new Date()): string {
  return new Date(now.getTime() - SLOT_SHIFT_MS).toISOString().slice(0, 10);
}

/** Час по Москве (0–23). */
export function moscowHour(now: Date = new Date()): number {
  return (now.getUTCHours() + MSK_OFFSET_HOURS) % 24;
}
