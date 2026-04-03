import { HabitType, INegativeHabit, THabit } from 'shared/types';
import { getDateISO } from '../date';

type GetHabitDayProgressParams = {
  habit: THabit;
  date: Date;
};

type HabitDayProgress = {
  isCompleted: boolean;
  percent: number;
};

export function getHabitDayProgress({
  habit,
  date,
}: GetHabitDayProgressParams): HabitDayProgress {
  const dateISO = getDateISO(date);
  const storedProgress = habit.progress?.[dateISO];

  if (habit.type === HabitType.QuitNegative) {
    const negativeHabit = habit as INegativeHabit;

    if (
      negativeHabit.isAutoFillEnabled &&
      canAutoFillDate(negativeHabit, dateISO)
    ) {
      return { isCompleted: true, percent: 1 };
    }

    const isCompleted = storedProgress?.isCompleted ?? false;

    return {
      isCompleted,
      percent: isCompleted ? 1 : 0,
    };
  }

  return {
    isCompleted: storedProgress?.isCompleted ?? false,
    percent: storedProgress?.percent ?? 0,
  };
}

function canAutoFillDate(habit: INegativeHabit, dateISO: string): boolean {
  if (!habit.startDate) {
    return false;
  }

  const targetDate = new Date(dateISO).getTime();
  const startDate = new Date(habit.startDate).getTime();

  if (targetDate < startDate) {
    return false;
  }

  const todayISO = getDateISO(new Date());
  const todayTime = new Date(todayISO).getTime();
  const habitEndTime = habit.endDate ? new Date(habit.endDate).getTime() : null;
  const autoFillEndTime =
    habitEndTime !== null ? Math.min(habitEndTime, todayTime) : todayTime;

  return targetDate <= autoFillEndTime;
}

