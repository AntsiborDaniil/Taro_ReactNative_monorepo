/**
 * Перенесено из apps/web/src/shared/types/habit.types.ts — только поля,
 * нужные виджету главной (прогресс за сегодня). Тип чистый (без RN).
 */
export enum HabitType {
  BuildPositive = 'buildPositive',
  QuitNegative = 'quitNegative',
}

export type THabitProgress = {
  amount?: number;
  percent: number;
  isCompleted: boolean;
};

export type THabit = {
  id: string | null;
  title: string;
  isActive: boolean;
  type: HabitType;
  startDate: string | null;
  endDate?: string | null;
  frequencyDays?: number[];
  isAutoFillEnabled?: boolean;
  progress: Record<string, THabitProgress> | null;
  /** Время напоминания "HH:MM" — вводится нативным <input type="time"> в /habits/new. */
  reminderTime?: string | null;
  bestStreak?: number;
};
