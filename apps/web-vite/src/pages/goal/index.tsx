import { useEffect, type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getDateISO, getCurrentWeekBounds } from '@shared/lib/date';
import { HabitType, selectHabitsOfTheWeek } from '@entities/habits';
import { MotivationKey } from '@entities/tarotMotivation';
import { useAppSelector } from '@shared/lib/store';
import { Button, Header, Text } from '@shared/ui';
import styles from './Goal.module.css';

const REWARD_STORAGE_KEY = 'GoalCelebrationWeek';

/**
 * Перенос apps/web/src/pages/goalCelebration — одноразовый экран-поздравление
 * (без цикличной анимации, только CSS-появление при маунте). CTA запоминает
 * неделю (чтобы баннер в /habits/week больше не показывался) и ведёт на
 * /motivation за наградой-мотивацией.
 */
export default function GoalPage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const habitsOfTheWeek = useAppSelector(selectHabitsOfTheWeek);

  useEffect(() => {
    try {
      window.localStorage.setItem(REWARD_STORAGE_KEY, getDateISO(getCurrentWeekBounds().start));
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.column}>
        <Header title={t('achievements:header')} />
        <div className={styles.card}>
          <div className={styles.iconWrap}>★</div>
          <Text role="title" as="h1" className={styles.title}>
            {t('achievements:title')}
          </Text>
          <span className={styles.badge}>{t('achievements:badge')}</span>
          <Text role="body" tone="ink100" className={styles.description}>
            {t('achievements:description')}
          </Text>
          <Button
            fullWidth
            onClick={() => {
              const goodHabits = habitsOfTheWeek.filter((h) => h.type === HabitType.BuildPositive).map((h) => h.title);
              const badHabits = habitsOfTheWeek.filter((h) => h.type === HabitType.QuitNegative).map((h) => h.title);
              navigate('/motivation', { state: { key: MotivationKey.Habits, params: { goodHabits, badHabits } } });
            }}
          >
            {t('achievements:cta')}
          </Button>
        </div>
      </div>
    </div>
  );
}
