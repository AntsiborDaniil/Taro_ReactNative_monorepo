/** Москва живёт в UTC+3 без перевода часов. */
const MSK_OFFSET_MS = 3 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Сколько миллисекунд до ближайшего hh:mm:ss по Москве (строго в будущем).
 * Нужен для рассылки «заряд обновился» ровно в 10:00 МСК.
 */
export function msUntilMoscowTime(hour: number, minute = 0, second = 0, now: Date = new Date()): number {
  const mskNow = now.getTime() + MSK_OFFSET_MS;
  const mskMidnight = Math.floor(mskNow / DAY_MS) * DAY_MS;
  let target = mskMidnight + ((hour * 60 + minute) * 60 + second) * 1000;
  if (target <= mskNow) target += DAY_MS;
  return target - mskNow;
}

/** Запускать job каждый день в hh:mm:ss по Москве (setTimeout-цепочка, без дрейфа). */
export function scheduleDailyAtMoscow(hour: number, minute: number, second: number, job: () => void): void {
  const arm = () => {
    setTimeout(() => {
      job();
      arm();
    }, msUntilMoscowTime(hour, minute, second));
  };
  arm();
}
