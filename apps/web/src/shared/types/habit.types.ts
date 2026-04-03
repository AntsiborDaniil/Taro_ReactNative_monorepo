export enum HabitType {
  BuildPositive = 'buildPositive',
  QuitNegative = 'quitNegative',
}

export enum HabitFrequency {
  OneTime = 'oneTime',
  Daily = 'daily',
}

// чтобы человек мог менять цели на лету
export type THabitGoal = {
  amount: number;
  unit: string;
  startDate: string;
};

export type THabitProgress = {
  amount?: number;
  percent: number;
  isCompleted: boolean;
};

export interface IBaseHabit {
  id: string | null;
  title: string;
  isActive: boolean;
  emoji: string | null;
  startDate: string | null;
  createdAt: string | null;
  color?: string;
  updatedAt?: string | null;
  endDate?: string | null;
  description?: string;
  currentStreak: number;
  bestStreak: number;
  // дата - прогресс
  progress: Record<string, THabitProgress> | null;
}

export interface IPositiveHabit extends IBaseHabit {
  type: HabitType.BuildPositive;
  goals: THabitGoal[];
  frequency: HabitFrequency;
  // дни недели (0 - 6), если месяц (0 - 30)
  frequencyDays: number[];
}

export interface INegativeHabit extends IBaseHabit {
  type: HabitType.QuitNegative;
  isAutoFillEnabled: boolean;
}

export type THabit = IPositiveHabit | INegativeHabit;
