import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MoodDisplayMode, TMemoryMoodItem, TMoodItem } from 'shared/api';
import { AsyncMemoryKey, saveAsyncDeviceMemoryKey } from 'shared/lib';
import {
  aggregateMoodsByMonth,
  getMoodDatesValues,
  getTodayDate,
  NUMERICAL_MOOD_VALUES,
} from '../lib';

type TUpdateMoodItemParameters = {
  name: keyof TMoodItem;
  value: number;
};

export type TMoodAndEnergyHookResult = {
  displayData: TMemoryMoodItem[];
  dateMode: MoodDisplayMode;
  todayProgress: {
    percents: number;
    allValuesCount: number;
    filledValuesCount: number;
    values: TMoodItem;
  };
  updateTodayMood: (params: TUpdateMoodItemParameters) => void;
  setDateMode: (mode: MoodDisplayMode) => void;
};

const SAVE_DELAY_MS = 1500;

const STORAGE_KEY: AsyncMemoryKey = AsyncMemoryKey.MoodData;

export function useMoodAndEnergy(): TMoodAndEnergyHookResult {
  const [allMoods, setAllMoods] = useState<TMemoryMoodItem[]>([]);
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);
  const [dateMode, setDateMode] = useState<MoodDisplayMode>(
    MoodDisplayMode.Week
  );

  // --- загрузка при инициализации ---
  useEffect(() => {
    (async () => {
      try {
        const rangeValues = await getMoodDatesValues();

        setAllMoods(rangeValues);
      } catch (e) {
        console.log(e);
      }
    })();
  }, []);

  const updateTodayMood = useCallback(
    ({ name, value }: TUpdateMoodItemParameters) => {
      const today = getTodayDate();

      setAllMoods((prevState) => {
        const todayMoodItem = prevState[prevState.length - 1];

        if (today === todayMoodItem.date) {
          const newArray = prevState.slice(0, -1);

          newArray.push({
            ...todayMoodItem,
            [name]: value,
          });

          return newArray;
        }

        prevState.push({
          date: today,
          stress: null,
          energy: null,
          mood: null,
          [name]: value,
        });

        return prevState;
      });
    },
    []
  );

  const displayMoods = useMemo(() => {
    return {
      [MoodDisplayMode.Week]: allMoods.slice(allMoods.length - 7),
      [MoodDisplayMode.Month]: allMoods.slice(allMoods.length - 30),
      [MoodDisplayMode.Year]: aggregateMoodsByMonth(
        allMoods.slice(allMoods.length - 365)
      ),
    };
  }, [allMoods]);

  useEffect(() => {
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }

    saveTimeout.current = setTimeout(async () => {
      saveAsyncDeviceMemoryKey(STORAGE_KEY, allMoods).catch((err) =>
        console.error('Ошибка при сохранении настроения:', err)
      );
    }, SAVE_DELAY_MS);
  }, [allMoods]);

  const todayProgress = useMemo(() => {
    const today = allMoods[allMoods.length - 1];

    const todayAsArray = Object.entries(today ?? {}).filter(
      ([key]) =>
        NUMERICAL_MOOD_VALUES[key as keyof typeof NUMERICAL_MOOD_VALUES]
    );

    const filledValuesCount = todayAsArray.reduce((acc, [key, value]) => {
      if (value !== null) {
        return acc + 1;
      }

      return acc;
    }, 0);

    return {
      percents: Math.floor((filledValuesCount / todayAsArray.length) * 100),
      filledValuesCount,
      allValuesCount: todayAsArray.length,
      values: {
        mood: today?.mood,
        energy: today?.energy,
        stress: today?.stress,
      },
    };
  }, [allMoods]);

  useEffect(() => {
    return () => {
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }
    };
  }, []);

  return {
    displayData: displayMoods[dateMode],
    updateTodayMood,
    setDateMode,
    dateMode,
    todayProgress,
  };
}
