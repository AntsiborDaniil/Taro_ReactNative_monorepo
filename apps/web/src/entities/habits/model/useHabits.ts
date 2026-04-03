import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AsyncMemoryKey,
  getCurrentWeekBounds,
  getDateISO,
  getValueForAsyncDeviceMemoryKey,
  saveAsyncDeviceMemoryKey,
} from 'shared/lib';
import { HabitType, INegativeHabit, THabit } from 'shared/types';
import { TFillInSimpleHabitParameters, THabitsHookResult } from './types';

const DAY_IN_MS = 1000 * 60 * 60 * 24;

export function useHabits(): THabitsHookResult {
  const [habits, setHabits] = useState<THabit[]>([]);

  useEffect(() => {
    async function initializeHabits() {
      setHabits(
        (await getValueForAsyncDeviceMemoryKey(AsyncMemoryKey.Habits)) || []
      );
    }

    initializeHabits();
  }, []);

  const habitsOfTheDay = useMemo(() => {
    return habits.reduce((acc: THabit[], curr) => {
      if (!curr.isActive) {
        return acc;
      }

      if (
        curr.type === HabitType.BuildPositive &&
        !curr.frequencyDays.includes(new Date().getDay() - 1)
      ) {
        return acc;
      }

      if (!curr.startDate || new Date(curr.startDate).getTime() > Date.now()) {
        return acc;
      }

      if (curr.endDate && new Date(curr.endDate).getTime() < Date.now()) {
        return acc;
      } else {
        return [...acc, curr];
      }
    }, []);
  }, [habits]);

  const habitsOfTheWeek = useMemo(() => {
    return habits.reduce((acc: THabit[], curr) => {
      if (!curr.isActive) {
        return acc;
      }

      const { start, end } = getCurrentWeekBounds();

      if (
        !curr.startDate ||
        new Date(curr.startDate).getTime() > end.getTime()
      ) {
        return acc;
      }

      if (curr.endDate && new Date(curr.endDate).getTime() < start.getTime()) {
        return acc;
      } else {
        return [...acc, curr];
      }
    }, []);
  }, [habits]);

  // console.log({ habits, habitsOfTheDay, habitsOfTheWeek });

  const persistHabits = useCallback(async (nextHabits: THabit[]) => {
    setHabits(nextHabits);

    await saveAsyncDeviceMemoryKey(AsyncMemoryKey.Habits, nextHabits);
  }, []);

  const createHabit = useCallback(
    async (newHabit: THabit) => {
      await persistHabits([...habits, newHabit]);
    },
    [habits, persistHabits]
  );

  const fillInSimpleHabit = useCallback(
    async ({ id, date }: TFillInSimpleHabitParameters) => {
      if (!id) {
        return;
      }

      const updatedHabits = habits.reduce((acc: THabit[], curr) => {
        if (curr.id !== id || !curr.isActive) {
          return [...acc, curr];
        }

        const currentProgressCompleted = curr.progress?.[date]?.isCompleted;

        return [
          ...acc,
          {
            ...curr,
            progress: {
              ...(curr.progress ?? {}),
              [date]: {
                isCompleted: !currentProgressCompleted,
                percent: currentProgressCompleted ? 0 : 1,
              },
            },
          },
        ];
      }, []);

      await persistHabits(updatedHabits);
    },
    [habits, persistHabits]
  );

  const deleteHabit = useCallback(
    async (habitId: string | null) => {
      if (!habitId) {
        return;
      }

      const updatedHabits = habits.filter((habit) => habit.id !== habitId);

      await persistHabits(updatedHabits);
    },
    [habits, persistHabits]
  );

  const calculateAutoFillStreak = useCallback((habit: THabit) => {
    if (habit.type !== HabitType.QuitNegative) {
      return 0;
    }

    const negativeHabit = habit as INegativeHabit;

    if (!negativeHabit.isAutoFillEnabled || !habit.startDate) {
      return 0;
    }

    const startTime = new Date(habit.startDate).getTime();
    const todayISO = getDateISO(new Date());
    const todayTime = new Date(todayISO).getTime();
    const habitEndTime = habit.endDate
      ? new Date(habit.endDate).getTime()
      : null;
    const counterEndTime =
      habitEndTime !== null ? Math.min(habitEndTime, todayTime) : todayTime;

    if (counterEndTime < startTime) {
      return 0;
    }

    return Math.floor((counterEndTime - startTime) / DAY_IN_MS) + 1;
  }, []);

  const resetHabitProgress = useCallback(
    async (habitId: string | null) => {
      if (!habitId) {
        return;
      }

      const todayISO = getDateISO(new Date());
      const updatedHabits = habits.map((habit) => {
        if (
          habit.id !== habitId ||
          habit.type !== HabitType.QuitNegative ||
          !(habit as INegativeHabit).isAutoFillEnabled
        ) {
          return habit;
        }

        const autoFillStreak = calculateAutoFillStreak(habit);

        return {
          ...habit,
          progress: null,
          currentStreak: 0,
          bestStreak: Math.max(habit.bestStreak ?? 0, autoFillStreak),
          startDate: todayISO,
          updatedAt: Date.now().toString(),
        };
      });

      await persistHabits(updatedHabits);
    },
    [calculateAutoFillStreak, habits, persistHabits]
  );

  return {
    habits,
    habitsOfTheDay,
    habitsOfTheWeek,
    createHabit,
    fillInSimpleHabit,
    deleteHabit,
    resetHabitProgress,
  };
}
