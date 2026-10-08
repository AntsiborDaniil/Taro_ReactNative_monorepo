import type { InterpretContext } from './getAIRequestBody';

type MoodEntry = { date: string; mood: number | null; energy: number | null; stress: number | null };
type HabitEntry = { title: string; isActive: boolean };

const MOOD_MAX_AGE_DAYS = 3;
const MAX_HABITS = 3;

/**
 * Контекст для «памяти» сервера. Чистая функция: данные настроения/привычек
 * передаёт вызывающая страница (entities друг на друга не ссылаются).
 */
export function buildInterpretContext(moods: MoodEntry[], habits: HabitEntry[]): InterpretContext | undefined {
  const context: InterpretContext = {};

  const last = moods[moods.length - 1];
  if (last && /^\d{4}-\d{2}-\d{2}$/.test(last.date) && (last.mood != null || last.energy != null || last.stress != null)) {
    const ageDays = (Date.now() - new Date(`${last.date}T12:00:00`).getTime()) / 86_400_000;
    if (ageDays <= MOOD_MAX_AGE_DAYS) {
      context.mood = { mood: last.mood, energy: last.energy, stress: last.stress, date: last.date };
    }
  }

  const titles = habits
    .filter((habit) => habit.isActive && habit.title.trim())
    .map((habit) => habit.title.trim().slice(0, 60))
    .slice(0, MAX_HABITS);
  if (titles.length) context.habits = titles;

  return context.mood || context.habits ? context : undefined;
}
