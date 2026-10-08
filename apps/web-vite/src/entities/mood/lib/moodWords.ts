export type MoodMetric = 'mood' | 'energy' | 'stress';

/** Уровень 0–4 по значению 0–10: для слова-описания под метрикой. */
export function levelOf(value: number): 0 | 1 | 2 | 3 | 4 {
  if (value <= 2) return 0;
  if (value <= 4) return 1;
  if (value <= 6) return 2;
  if (value <= 8) return 3;
  return 4;
}

/**
 * Ключ итога дня по трём метрикам (moodAndEnergy:summary.*), без LLM.
 * Порядок проверок — от самого заметного сигнала.
 */
export function summaryKey(values: { mood: number; energy: number; stress: number }): string {
  const { mood, energy, stress } = values;
  if (stress >= 7 && energy <= 4) return 'drained';
  if (stress >= 7) return 'tense';
  if (mood >= 7 && energy >= 7) return 'bright';
  if (mood <= 3) return 'heavy';
  if (energy <= 3) return 'tired';
  if (mood >= 6 && stress <= 3) return 'calm';
  return 'even';
}
