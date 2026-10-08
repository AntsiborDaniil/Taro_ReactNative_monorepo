import { createAsyncThunk, createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@app/store';
import { getDateISO, getCurrentWeekBounds } from '@shared/lib/date';
import { getHabitDayProgress, getHabitsOfTheDay } from './getHabitDayProgress';
import { HabitType, type THabit } from './types';

/**
 * Источник данных — локальное устройство (как в apps/web/src/entities/habits/model/useHabits.ts,
 * там же AsyncStorage = localStorage-полифилл на web). Ключ совпадает с
 * AsyncMemoryKey.Habits ('habits'). CRUD 1-в-1 с useHabits (createHabit,
 * fillInSimpleHabit, deleteHabit) — только синхронно (localStorage, не async).
 */
const STORAGE_KEY = 'habits';

export type HabitsState = {
  habits: THabit[];
  loaded: boolean;
};

const initialState: HabitsState = {
  habits: [],
  loaded: false,
};

function persist(habits: THabit[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
  } catch {
    /* ignore */
  }
}

export const loadHabits = createAsyncThunk('habits/load', (): THabit[] => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as THabit[]) : [];
  } catch {
    return [];
  }
});

const habitsSlice = createSlice({
  name: 'habits',
  initialState,
  reducers: {
    /** 1-в-1 useHabits().createHabit — id/дата старта проставляются на вызывающей стороне. */
    addHabit: (state, action: PayloadAction<THabit>) => {
      state.habits.push(action.payload);
      persist(state.habits);
    },
    /** 1-в-1 useHabits().fillInSimpleHabit — тоггл отметки дня. */
    toggleHabitDay: (state, action: PayloadAction<{ id: string; date: string }>) => {
      const { id, date } = action.payload;
      const habit = state.habits.find((item) => item.id === id);
      if (!habit) return;
      const wasCompleted = habit.progress?.[date]?.isCompleted ?? false;
      habit.progress = {
        ...(habit.progress ?? {}),
        [date]: { isCompleted: !wasCompleted, percent: wasCompleted ? 0 : 1 },
      };
      persist(state.habits);
    },
    /** Закрепить/открепить цель на главной (не больше MAX_PINNED_HABITS — проверяет UI). */
    togglePinHabit: (state, action: PayloadAction<string>) => {
      const habit = state.habits.find((item) => item.id === action.payload);
      if (!habit) return;
      habit.pinned = !habit.pinned;
      persist(state.habits);
    },
    /** 1-в-1 useHabits().deleteHabit. */
    removeHabit: (state, action: PayloadAction<string>) => {
      state.habits = state.habits.filter((habit) => habit.id !== action.payload);
      persist(state.habits);
    },
  },
  extraReducers: (builder) => {
    builder.addCase(loadHabits.fulfilled, (state, action) => {
      state.habits = action.payload;
      state.loaded = true;
    });
  },
});

export const { addHabit, toggleHabitDay, removeHabit, togglePinHabit } = habitsSlice.actions;
export const habitsReducer = habitsSlice.reducer;

const selectHabits = (state: RootState) => state.habits.habits;
export const selectHabitsLoaded = (state: RootState) => state.habits.loaded;

export const selectHabitsOfTheDay = createSelector(selectHabits, getHabitsOfTheDay);

export const selectHabitsTodayProgress = createSelector(selectHabitsOfTheDay, (habitsOfTheDay) => {
  const today = new Date();
  if (!habitsOfTheDay.length) {
    return { progressPercent: 0, completedGoals: 0, total: 0 };
  }
  const progressPercent =
    habitsOfTheDay.reduce((acc, habit) => acc + getHabitDayProgress({ habit, date: today }).percent, 0) /
    habitsOfTheDay.length;
  const completedGoals = habitsOfTheDay.reduce(
    (acc, habit) => acc + (getHabitDayProgress({ habit, date: today }).isCompleted ? 1 : 0),
    0,
  );
  return { progressPercent, completedGoals, total: habitsOfTheDay.length };
});

/** 1-в-1 useHabits().habitsOfTheWeek. */
export const selectHabitsOfTheWeek = createSelector(selectHabits, (habits) => {
  const { start, end } = getCurrentWeekBounds();
  return habits.filter((habit) => {
    if (!habit.isActive) return false;
    if (!habit.startDate || new Date(habit.startDate).getTime() > end.getTime()) return false;
    if (habit.endDate && new Date(habit.endDate).getTime() < start.getTime()) return false;
    return true;
  });
});

/**
 * Сколько разных дней недели требуют ручной отметки (объединение расписаний
 * привычек; автозаполняемые «бросить» не считаются) — для награды недели:
 * сервер проверяет, что отметки реально были в столько разных дней.
 */
export const selectWeekRequiredDays = createSelector(selectHabitsOfTheWeek, (habitsOfTheWeek) => {
  const { days } = getCurrentWeekBounds();
  const needed = new Set<number>();
  for (const habit of habitsOfTheWeek) {
    if (!habit.startDate) continue;
    if (habit.type === HabitType.QuitNegative && habit.isAutoFillEnabled) continue;
    days.forEach((day, index) => {
      const scheduled = habit.type === HabitType.QuitNegative || habit.frequencyDays?.includes(index);
      if (scheduled && day.getTime() >= new Date(habit.startDate as string).getTime()) needed.add(index);
    });
  }
  return needed.size;
});

/** 1-в-1 HabitWeek.isHabitCompletedForWeek — все привычки недели закрыты на 100%. */
export const selectAllHabitsCompletedThisWeek = createSelector(selectHabitsOfTheWeek, (habitsOfTheWeek) => {
  if (!habitsOfTheWeek.length) return false;
  const { days } = getCurrentWeekBounds();

  return habitsOfTheWeek.every((habit) => {
    if (!habit.startDate) return false;
    const needToFillDays = days.reduce<number[]>((acc, day, index) => {
      const isNeed =
        ((habit.type === HabitType.BuildPositive && habit.frequencyDays?.includes(index)) ||
          (habit.type === HabitType.QuitNegative && !habit.isAutoFillEnabled)) &&
        day.getTime() >= new Date(habit.startDate as string).getTime();
      return isNeed ? [...acc, index] : acc;
    }, []);
    const daysAmount = needToFillDays.length || 1;
    const progressPercent = days.reduce((acc, day) => acc + getHabitDayProgress({ habit, date: day }).percent, 0);
    return progressPercent / daysAmount >= 1;
  });
});

export const selectCurrentWeekStartISO = () => getDateISO(getCurrentWeekBounds().start);
