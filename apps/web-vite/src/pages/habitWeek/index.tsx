import { useEffect, type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  loadHabits,
  selectAllHabitsCompletedThisWeek,
  selectHabitsLoaded,
  selectHabitsOfTheWeek,
  useGetHabitWeekRewardQuery,
} from '@entities/habits';
import { HabitWeekCard } from '@features/habits';
import { useAppDispatch, useAppSelector } from '@shared/lib/store';
import { Button, ChargeMark, EmptyState, Header, Text } from '@shared/ui';
import styles from './HabitWeek.module.css';

/**
 * Список карточек привычек недели + баннер награды (+1 заряд за неделю, /goal):
 * виден, пока награда этой недели не получена (статус — с сервера).
 * Отмечать можно только сегодняшний день (HabitWeekCard).
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

  const isAuthenticated = useAppSelector((state) => state.user.isAuthenticated);
  const { data: reward } = useGetHabitWeekRewardQuery(undefined, { skip: !isAuthenticated });
  // Награда видна всю неделю (за что цели «платят»), пока не получена.
  const showRewardBanner = habitsOfTheWeek.length > 0 && !reward?.claimed;

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
                <span className={styles.bannerIcon}>
                  <ChargeMark size="md" />
                </span>
                <span className={styles.bannerTextCol}>
                  <Text role="label" as="span" className={styles.bannerTitle}>
                    {allCompleted ? t('habits:banner.rewardReady') : t('habits:banner.rewardTitle')}
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
