import { COLORS } from '../themes';
import { HabitFrequency, HabitType, THabit } from '../types';

export const DEFAULT_POSITIVE_HABIT: THabit = {
  id: null,
  title: '',
  isActive: true,
  emoji: null,
  color: COLORS.Secondary,
  type: HabitType.BuildPositive,
  startDate: null,
  createdAt: null,
  currentStreak: 0,
  bestStreak: 0,
  progress: null,
  goals: [],
  frequency: HabitFrequency.Daily,
  frequencyDays: [0, 1, 2, 3, 4, 5, 6],
};

export const DEFAULT_NEGATIVE_HABIT: THabit = {
  id: null,
  title: '',
  isActive: true,
  emoji: null,
  color: COLORS.Secondary,
  type: HabitType.QuitNegative,
  startDate: null,
  createdAt: null,
  progress: null,
  currentStreak: 0,
  bestStreak: 0,
  isAutoFillEnabled: false,
};
