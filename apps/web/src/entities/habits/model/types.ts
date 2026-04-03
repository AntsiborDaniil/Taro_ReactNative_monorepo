import type { THabit } from 'shared/types';

export type TFillInSimpleHabitParameters = {
  id: string | null;
  date: string;
};

export type THabitsHookResult = {
  habits: THabit[];
  habitsOfTheDay: THabit[];
  habitsOfTheWeek: THabit[];
  createHabit: (habit: THabit) => Promise<void>;
  fillInSimpleHabit: (params: TFillInSimpleHabitParameters) => Promise<void>;
  deleteHabit: (habitId: string | null) => Promise<void>;
  resetHabitProgress: (habitId: string | null) => Promise<void>;
};
