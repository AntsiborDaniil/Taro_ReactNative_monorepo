import { useEffect, type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  getHabitDayProgress,
  HabitType,
  loadHabits,
  selectHabitsLoaded,
  selectHabitsOfTheDay,
  selectHabitsTodayProgress,
} from '@entities/habits';
import { useToggleHabitToday } from '@features/habits';
import { getCurrentDate } from '@shared/lib/date';
import { useAppDispatch, useAppSelector } from '@shared/lib/store';
import { ChargeMark, CheckIcon, ChevronRightIcon, PlusIcon, Text } from '@shared/ui';
import styles from './HabitWidget.module.css';

/** Сколько целей показываем прямо на главной; остальные — по «Ещё N». */
const MAX_ROWS = 3;

function capitalizeFirst(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

/**
 * Виджет целей на главной (в паре с виджетом состояния, тот же визуальный язык):
 * заголовок-итог дня, полоса прогресса и до трёх целей сегодняшнего дня, которые
 * можно отметить прямо отсюда (toggleHabitDay, как в недельной карточке).
 * Пусто — приглашение добавить первую цель. Шапка → /habits/week, «+» → /habits/new.
 */
export function HabitWidget(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const loaded = useAppSelector(selectHabitsLoaded);
  const habits = useAppSelector(selectHabitsOfTheDay);
  const { progressPercent, completedGoals, total } = useAppSelector(selectHabitsTodayProgress);
  const toggleToday = useToggleHabitToday();

  useEffect(() => {
    if (!loaded) {
      dispatch(loadHabits());
    }
  }, [dispatch, loaded]);

  const today = new Date();
  const percent = Math.round(Math.min(1, Math.max(0, progressPercent)) * 100);
  const allDone = total > 0 && completedGoals === total;
  const title = !total
    ? t('habits:widget.emptyTitle')
    : allDone
      ? t('habits:widget.allDone')
      : t('habits:widget.completedGoals', { completed: completedGoals, total });
  // Закреплённые («На главной» в недельном экране) — первыми; если закреплены — только они.
  const pinned = habits.filter((h) => h.pinned);
  const shown = (pinned.length ? pinned : habits).slice(0, MAX_ROWS);
  const rest = habits.length - shown.length;

  return (
    <section className={styles.root}>
      <div className={styles.head}>
        <button type="button" className={styles.headLink} onClick={() => navigate('/habits/week')}>
          <span className={styles.headText}>
            <Text role="label" tone="accent" as="span">
              {t('habits:widget.label')}
            </Text>
            <Text role="lead" tone="ink50" as="span">
              {title}
            </Text>
            <Text role="micro" tone="ink100" as="span">
              {capitalizeFirst(getCurrentDate())}
            </Text>
          </span>
          {total ? (
            <span className={styles.percent}>
              <Text role="micro" tone="ink100" as="span">
                {`${percent}%`}
              </Text>
              <ChevronRightIcon width={18} height={18} />
            </span>
          ) : null}
        </button>
        <button
          type="button"
          className={styles.addButton}
          onClick={() => navigate('/habits/new')}
          aria-label={t('habits:widget.add')}
        >
          <PlusIcon width={22} height={22} />
        </button>
      </div>

      {total ? (
        <>
          <span className={styles.track} aria-hidden="true">
            <span className={styles.fill} style={{ width: `${percent}%` }} />
          </span>
          <ul className={styles.list}>
            {shown.map((habit) => {
              const { isCompleted } = getHabitDayProgress({ habit, date: today });
              // «Бросить привычку» с автозаполнением отмечается сама — руками не трогаем.
              const auto = habit.type === HabitType.QuitNegative && habit.isAutoFillEnabled;
              return (
                <li key={habit.id ?? habit.title}>
                  <button
                    type="button"
                    className={[styles.row, isCompleted ? styles.rowDone : ''].filter(Boolean).join(' ')}
                    aria-pressed={isCompleted}
                    disabled={auto || !habit.id}
                    onClick={() => toggleToday(habit)}
                  >
                    <span className={styles.check} aria-hidden="true">
                      {isCompleted ? <CheckIcon width={16} height={16} /> : null}
                    </span>
                    <span className={styles.rowTitle}>{habit.title}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className={styles.footer}>
            {rest > 0 ? (
              <button type="button" className={styles.more} onClick={() => navigate('/habits/week')}>
                {t('habits:widget.more', { count: rest })}
              </button>
            ) : (
              <span />
            )}
            {/* Награда недели — чтобы было понятно, за что цели «платят». */}
            <span className={styles.reward}>
              <Text role="micro" tone="ink100" as="span">
                {t('habits:widget.reward')}
              </Text>
              <ChargeMark size="xs" />
            </span>
          </div>
        </>
      ) : (
        <button type="button" className={styles.empty} onClick={() => navigate('/habits/new')}>
          <Text role="body" tone="ink100" as="span">
            {t('habits:widget.emptyHint')}
          </Text>
        </button>
      )}
    </section>
  );
}
