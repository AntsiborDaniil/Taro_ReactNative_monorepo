import { createAsyncThunk, createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@app/store';
import { getDateISO } from '@shared/lib/date';
import type { TMemoryMoodItem, TMoodItem } from './types';

/**
 * Источник данных — локальное устройство, как apps/web/src/entities/moodAndEnergy/model/useMoodAndEnergy.ts
 * (AsyncStorage = localStorage-полифилл на web, ключ AsyncMemoryKey.MoodData = 'MoodData').
 * Расширено записью (updateTodayMood 1-в-1): тоггл/правка последней записи, если
 * она за сегодня, иначе — новая запись.
 */
const STORAGE_KEY = 'MoodData';

export type MoodState = {
  allMoods: TMemoryMoodItem[];
  loaded: boolean;
};

const initialState: MoodState = {
  allMoods: [],
  loaded: false,
};

function persist(allMoods: TMemoryMoodItem[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(allMoods));
  } catch {
    /* ignore */
  }
}

export const loadMood = createAsyncThunk('mood/load', (): TMemoryMoodItem[] => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TMemoryMoodItem[]) : [];
  } catch {
    return [];
  }
});

const moodSlice = createSlice({
  name: 'mood',
  initialState,
  reducers: {
    /** 1-в-1 useMoodAndEnergy().updateTodayMood. */
    setMoodValue: (state, action: PayloadAction<{ name: keyof TMoodItem; value: number }>) => {
      const { name, value } = action.payload;
      const today = getDateISO(new Date());
      const last = state.allMoods[state.allMoods.length - 1];

      if (last && last.date === today) {
        last[name] = value;
      } else {
        state.allMoods.push({ date: today, mood: null, energy: null, stress: null, [name]: value });
      }
      persist(state.allMoods);
    },
  },
  extraReducers: (builder) => {
    builder.addCase(loadMood.fulfilled, (state, action) => {
      state.allMoods = action.payload;
      state.loaded = true;
    });
  },
});

export const { setMoodValue } = moodSlice.actions;
export const moodReducer = moodSlice.reducer;

const selectAllMoods = (state: RootState) => state.mood.allMoods;
export const selectMoodLoaded = (state: RootState) => state.mood.loaded;

/** 1-в-1 useMoodAndEnergy().todayProgress: доля заполненных значений на последнюю запись. */
export const selectTodayMoodProgress = createSelector(selectAllMoods, (allMoods) => {
  const todayISO = getDateISO(new Date());
  const last = allMoods[allMoods.length - 1];
  const today = last?.date === todayISO ? last : undefined;

  const entries = (['mood', 'energy', 'stress'] as const).map((key) => today?.[key] ?? null);
  const filledValuesCount = entries.filter((v) => v !== null).length;
  const allValuesCount = entries.length;

  return {
    percents: allValuesCount ? Math.floor((filledValuesCount / allValuesCount) * 100) : 0,
    filledValuesCount,
    allValuesCount,
  };
});

/** Текущие оценки за сегодня (для слайдеров /mood) — 1-в-1 todayProgress.values. */
export const selectTodayMoodValues = createSelector(selectAllMoods, (allMoods): TMoodItem => {
  const todayISO = getDateISO(new Date());
  const last = allMoods[allMoods.length - 1];
  const today = last?.date === todayISO ? last : undefined;
  return { mood: today?.mood ?? null, energy: today?.energy ?? null, stress: today?.stress ?? null };
});

/** Последние 7 дней (включая сегодня) — данные для SVG-графика на /mood. */
export const selectMoodWeekSeries = createSelector(selectAllMoods, (allMoods) => allMoods.slice(-7));
