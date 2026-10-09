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
const SYNCED_KEY_PREFIX = 'habitsCheckinSynced';

function isSyncedToday(userId: string | null, day: string, habitId: string): boolean {
  try {
    return window.localStorage.getItem(`${SYNCED_KEY_PREFIX}:${userId ?? 'anon'}:${day}`)?.split(',').includes(habitId) ?? false;
  } catch {
    return false;
  }
}

/** Запоминаем успешно отправленную цель: повторный заход за день не шлёт её заново. */
function markSyncedToday(userId: string | null, day: string, habitId: string): void {
  try {
    const key = `${SYNCED_KEY_PREFIX}:${userId ?? 'anon'}:${day}`;
    const ids = window.localStorage.getItem(key)?.split(',').filter(Boolean) ?? [];
    if (!ids.includes(habitId)) window.localStorage.setItem(key, [...ids, habitId].join(','));
  } catch {
    // localStorage недоступен — просто отправим повторно в следующий раз.
  }
}

export function useSyncTodayCheckins(): void {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.user.isAuthenticated);
  const loaded = useAppSelector(selectHabitsLoaded);
  const habits = useAppSelector(selectHabitsOfTheDay);
  const [checkin] = useHabitCheckinMutation();
  const userId = useAppSelector((state) => state.user.user?.id ?? null);
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
        const habitId = habit.id;
        if (isSyncedToday(userId, key, habitId)) continue;
        checkin({ habitId, done: true })
          .unwrap()
          .then(() => markSyncedToday(userId, key, habitId))
          .catch(() => undefined);
      }
    }
  }, [isAuthenticated, loaded, habits, checkin, userId]);
}
