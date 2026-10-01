import { useEffect, type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { selectHabitsLoaded, selectHabitsTodayProgress, loadHabits } from '@entities/habits';
import { useAppDispatch, useAppSelector } from '@shared/lib/store';
import { getCurrentDate } from '@shared/lib/date';
import { PlusIcon } from '@shared/ui';
import styles from './HabitWidget.module.css';

function capitalizeFirst(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

/**
 * Перенос apps/web/src/widgets/habitWidget/HabitWidget.tsx — логика 1-в-1
 * (чтение habitsOfTheDay из локального хранилища, доля выполнения за сегодня),
 * разметка на CSS Modules. Клик по плашке → /habits/week, «+» → /habits/new.
 */
export function HabitWidget(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const loaded = useAppSelector(selectHabitsLoaded);
  const { progressPercent, completedGoals, total } = useAppSelector(selectHabitsTodayProgress);

  useEffect(() => {
    if (!loaded) {
      dispatch(loadHabits());
    }
  }, [dispatch, loaded]);

  const date = capitalizeFirst(getCurrentDate());
  const percent = Math.round(Math.min(1, Math.max(0, progressPercent)) * 100);

  return (
    <div
      className={styles.root}
      role="button"
      tabIndex={0}
      onClick={() => navigate('/habits/week')}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          navigate('/habits/week');
        }
      }}
    >
      <div className={styles.main}>
        <div className={styles.headerRow}>
          <span className={styles.date}>{date}</span>
          <span className={styles.percent}>{`${percent}%`}</span>
        </div>
        <div className={styles.track}>
          <div className={styles.fill} style={{ width: `${percent}%` }} />
        </div>
        <p className={styles.goalsText}>
          {total
            ? t('habits:widget.completedGoals', { completed: completedGoals, total })
            : t('habits:widget.empty')}
        </p>
      </div>
      <button
        type="button"
        className={styles.addButton}
        onClick={(event) => {
          event.stopPropagation();
          navigate('/habits/new');
        }}
      >
        <PlusIcon width={24} height={24} />
      </button>
    </div>
  );
}
