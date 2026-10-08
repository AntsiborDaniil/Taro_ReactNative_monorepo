import { useEffect, useRef } from 'react';
import {
  getHabitDayProgress,
  loadHabits,
  selectHabitsLoaded,
  selectHabitsOfTheDay,
  useHabitCheckinMutation,
} from '@entities/habits';
import { getDateISO } from '@shared/lib/date';
import { useAppDispatch, useAppSelector } from '@shared/lib/store';

/**
 * Досинхронизация серверных отметок за сегодня: как только сессия готова, шлём
 * все цели, отмеченные сегодня локально (сервер делает upsert — повтор безвреден).
 * Закрывает гонку «отметил в первые секунды Mini App, до входа по initData» и
 * отметки без сети. Только сегодняшний день: прошлые дни сервер не примет —
 * он ставит дату сам.
 */
export function useSyncTodayCheckins(): void {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.user.isAuthenticated);
  const loaded = useAppSelector(selectHabitsLoaded);
  const habits = useAppSelector(selectHabitsOfTheDay);
  const [checkin] = useHabitCheckinMutation();
  const syncedFor = useRef<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && !loaded) dispatch(loadHabits());
  }, [dispatch, isAuthenticated, loaded]);

  useEffect(() => {
    if (!isAuthenticated || !loaded) return;
    const today = new Date();
    const key = getDateISO(today);
    if (syncedFor.current === key) return;
    syncedFor.current = key;
    for (const habit of habits) {
      if (!habit.id) continue;
      if (getHabitDayProgress({ habit, date: today }).isCompleted && habit.progress?.[key]?.isCompleted) {
        checkin({ habitId: habit.id, done: true }).catch(() => undefined);
      }
    }
  }, [isAuthenticated, loaded, habits, checkin]);
}
