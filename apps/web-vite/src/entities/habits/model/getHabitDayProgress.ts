import { getDateISO } from '@shared/lib/date';
import { HabitType, type THabit } from './types';

export type HabitDayProgress = {
  isCompleted: boolean;
  percent: number;
};

/** Перенесено 1-в-1 из apps/web/src/shared/lib/habits/getHabitDayProgress.ts. */
export function getHabitDayProgress({ habit, date }: { habit: THabit; date: Date }): HabitDayProgress {
  const dateISO = getDateISO(date);
  const storedProgress = habit.progress?.[dateISO];

  if (habit.type === HabitType.QuitNegative) {
    if (habit.isAutoFillEnabled && canAutoFillDate(habit, dateISO)) {
      return { isCompleted: true, percent: 1 };
    }
    const isCompleted = storedProgress?.isCompleted ?? false;
    return { isCompleted, percent: isCompleted ? 1 : 0 };
  }

  return {
    isCompleted: storedProgress?.isCompleted ?? false,
    percent: storedProgress?.percent ?? 0,
  };
}

function canAutoFillDate(habit: THabit, dateISO: string): boolean {
  if (!habit.startDate) return false;

  const targetDate = new Date(dateISO).getTime();
  const startDate = new Date(habit.startDate).getTime();
  if (targetDate < startDate) return false;

  const todayISO = getDateISO(new Date());
  const todayTime = new Date(todayISO).getTime();
  const habitEndTime = habit.endDate ? new Date(habit.endDate).getTime() : null;
  const autoFillEndTime = habitEndTime !== null ? Math.min(habitEndTime, todayTime) : todayTime;

  return targetDate <= autoFillEndTime;
}

/** Активные привычки на сегодня — фильтр 1-в-1 useHabits().habitsOfTheDay. */
export function getHabitsOfTheDay(habits: THabit[]): THabit[] {
  return habits.reduce<THabit[]>((acc, curr) => {
    if (!curr.isActive) return acc;

    if (
      curr.type === HabitType.BuildPositive &&
      curr.frequencyDays &&
      // Индекс дня недели с понедельника (Пн=0…Вс=6); getDay() у воскресенья — 0.
      !curr.frequencyDays.includes((new Date().getDay() + 6) % 7)
    ) {
      return acc;
    }

    if (!curr.startDate || new Date(curr.startDate).getTime() > Date.now()) return acc;
    if (curr.endDate && new Date(curr.endDate).getTime() < Date.now()) return acc;

    return [...acc, curr];
  }, []);
}
