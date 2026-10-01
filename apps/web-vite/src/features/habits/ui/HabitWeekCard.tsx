import { useMemo, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { getDateISO, getCurrentWeekBounds, getLocalizedWeekdays } from '@shared/lib/date';
import { getHabitDayProgress, HabitType, removeHabit, toggleHabitDay, type THabit } from '@entities/habits';
import { useAppDispatch } from '@shared/lib/store';
import { CheckIcon, CloseIcon, Text } from '@shared/ui';
import styles from './HabitWeekCard.module.css';

export type HabitWeekCardProps = { habit: THabit };

/**
 * Перенос apps/web/src/features/habits/ui/HabitWeekCard — без swipe-жестов
 * (кнопка удаления видима сразу), круги дней недели с отметкой выполнения.
 * Автозаполняемые (quit + isAutoFillEnabled) привычки — только счётчик дней,
 * без ручных отметок (как в старом коде).
 */
export function HabitWeekCard({ habit }: HabitWeekCardProps): ReactElement {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();

  const { days } = useMemo(() => getCurrentWeekBounds(), []);
  const weekDays = useMemo(() => getLocalizedWeekdays(i18n.language), [i18n.language]);

  const isAutoFillEnabled = habit.type === HabitType.QuitNegative && Boolean(habit.isAutoFillEnabled);

  const needToFillDays = useMemo(
    () =>
      days.reduce<number[]>((acc, day, index) => {
        const isNeed =
          ((habit.type === HabitType.BuildPositive && habit.frequencyDays?.includes(index)) ||
            habit.type === HabitType.QuitNegative) &&
          Boolean(habit.startDate) &&
          day.getTime() >= new Date(habit.startDate as string).getTime();
        return isNeed ? [...acc, index] : acc;
      }, []),
    [days, habit],
  );

  const daysAmount = needToFillDays.length || 1;
  const progressSum = days.reduce((acc, day) => acc + getHabitDayProgress({ habit, date: day }).percent, 0);
  const percent = Math.round((progressSum / daysAmount) * 100);

  const autoFillCounter = useMemo(() => {
    if (!isAutoFillEnabled || !habit.startDate) return 0;
    const startTime = new Date(habit.startDate).getTime();
    const todayTime = new Date(getDateISO(new Date())).getTime();
    const endTime = habit.endDate ? new Date(habit.endDate).getTime() : null;
    const counterEndTime = endTime !== null ? Math.min(endTime, todayTime) : todayTime;
    if (counterEndTime < startTime) return 0;
    return Math.floor((counterEndTime - startTime) / (1000 * 60 * 60 * 24)) + 1;
  }, [habit, isAutoFillEnabled]);

  const handleDelete = () => {
    if (!habit.id) return;
    if (window.confirm(t('habits:confirm.delete.description'))) {
      dispatch(removeHabit(habit.id));
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.titleCol}>
          {isAutoFillEnabled && autoFillCounter > 0 ? (
            <span className={styles.counter}>{t('habits:label.autoFillCounter', { count: autoFillCounter })}</span>
          ) : null}
          <Text role="label" as="h3" className={styles.title}>
            {habit.title}
          </Text>
        </div>
        {!isAutoFillEnabled ? <span className={styles.percent}>{`${percent}%`}</span> : null}
        <button type="button" className={styles.deleteButton} aria-label={t('habits:button.deleteHabit')} onClick={handleDelete}>
          <CloseIcon width={16} height={16} />
        </button>
      </div>

      {!isAutoFillEnabled ? (
        <div className={styles.days}>
          {days.map((day, index) => {
            const needToFill = needToFillDays.includes(index);
            const dayISO = getDateISO(day);
            const { isCompleted } = getHabitDayProgress({ habit, date: day });

            return (
              <div key={dayISO} className={styles.dayCell}>
                <span className={styles.dayLabel}>{weekDays[index]?.day ?? ''}</span>
                <button
                  type="button"
                  disabled={!needToFill || !habit.id}
                  className={[styles.dayDot, needToFill ? styles.dayDotNeeded : null, isCompleted ? styles.dayDotDone : null]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => habit.id && dispatch(toggleHabitDay({ id: habit.id, date: dayISO }))}
                  aria-pressed={isCompleted}
                >
                  {isCompleted ? <CheckIcon width={16} height={16} /> : null}
                </button>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
