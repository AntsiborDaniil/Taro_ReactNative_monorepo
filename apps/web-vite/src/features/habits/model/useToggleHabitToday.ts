import { useCallback } from 'react';
import { getHabitDayProgress, toggleHabitDay, useHabitCheckinMutation, type THabit } from '@entities/habits';
import { getDateISO } from '@shared/lib/date';
import { haptic } from '@shared/lib/haptics';
import { useAppDispatch } from '@shared/lib/store';

/**
 * Отметить цель за сегодня: локально (как раньше) + серверный след для награды
 * недели (POST /api/habits/checkin, день ставит сервер). Отмечать можно только
 * сегодняшний день — прошлые дни не «добиваются» задним числом.
 */
export function useToggleHabitToday(): (habit: THabit) => void {
  const dispatch = useAppDispatch();
  const [checkin] = useHabitCheckinMutation();

  return useCallback(
    (habit: THabit) => {
      if (!habit.id) return;
      const today = new Date();
      const wasCompleted = getHabitDayProgress({ habit, date: today }).isCompleted;
      if (wasCompleted) haptic.selection();
      else haptic.impact('light');
      dispatch(toggleHabitDay({ id: habit.id, date: getDateISO(today) }));
      // Шлём всегда, не дожидаясь isAuthenticated: в первые секунды Mini App сессия
      // (cookie) уже есть, а флаг в сторе ещё false — отметка терялась. Гость получит
      // 401 — это безвредно. Best effort: локальная отметка остаётся и без сети.
      checkin({ habitId: habit.id, done: !wasCompleted }).catch(() => undefined);
    },
    [dispatch, checkin],
  );
}
