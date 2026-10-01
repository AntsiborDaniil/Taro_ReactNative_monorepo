import { useEffect, useMemo, type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  loadHabits,
  selectAllHabitsCompletedThisWeek,
  selectHabitsLoaded,
  selectHabitsOfTheWeek,
} from '@entities/habits';
import { HabitWeekCard } from '@features/habits';
import { useAppDispatch, useAppSelector } from '@shared/lib/store';
import { getDateISO, getCurrentWeekBounds } from '@shared/lib/date';
import { Button, EmptyState, Header, Text } from '@shared/ui';
import styles from './HabitWeek.module.css';

const REWARD_STORAGE_KEY = 'GoalCelebrationWeek';

/**
 * Перенос apps/web/src/pages/habitWeek — список карточек привычек недели +
 * баннер награды (переход на /goal), если все цели недели закрыты на 100% и
 * награда ещё не забиралась на этой неделе (ключ в localStorage, 1-в-1
 * AsyncMemoryKey.GoalCelebrationWeek).
 */
export default function HabitWeekPage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const loaded = useAppSelector(selectHabitsLoaded);
  const habitsOfTheWeek = useAppSelector(selectHabitsOfTheWeek);
  const allCompleted = useAppSelector(selectAllHabitsCompletedThisWeek);

  useEffect(() => {
    if (!loaded) dispatch(loadHabits());
  }, [dispatch, loaded]);

  const weekStartISO = useMemo(() => getDateISO(getCurrentWeekBounds().start), []);
  const rewardWeek = typeof window !== 'undefined' ? window.localStorage.getItem(REWARD_STORAGE_KEY) : null;
  const showRewardBanner = habitsOfTheWeek.length > 0 && allCompleted && rewardWeek !== weekStartISO;

  return (
    <div className={styles.page}>
      <div className={styles.column}>
        <Header title={t('habits:title.progress')} />
        {!habitsOfTheWeek.length ? (
          <EmptyState
            title={t('habits:title.empty')}
            action={
              <Button onClick={() => navigate('/habits')}>{t('habits:button.empty')}</Button>
            }
          />
        ) : (
          <>
            {showRewardBanner ? (
              <button type="button" className={styles.banner} onClick={() => navigate('/goal')}>
                <span className={styles.bannerIcon}>★</span>
                <span className={styles.bannerTextCol}>
                  <Text role="label" as="span" className={styles.bannerTitle}>
                    {t('habits:banner.rewardTitle')}
                  </Text>
                  <Text role="body" tone="ink100" as="span">
                    {t('habits:banner.rewardDescription')}
                  </Text>
                </span>
              </button>
            ) : null}
            <div className={styles.list}>
              {habitsOfTheWeek.map((habit) => (
                <HabitWeekCard key={habit.id} habit={habit} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
