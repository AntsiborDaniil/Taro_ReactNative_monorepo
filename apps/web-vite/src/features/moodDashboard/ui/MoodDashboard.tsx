import { useEffect, type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { loadMood, selectMoodLoaded, selectTodayMoodProgress } from '@entities/mood';
import { useAppDispatch, useAppSelector } from '@shared/lib/store';
import styles from './MoodDashboard.module.css';

const SIZE = 60;
const TRACK_WIDTH = 5;
const RADIUS = (SIZE - TRACK_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Перенос apps/web/src/features/MoodDashboard (только режим isWidget=true —
 * на главной рендерится исключительно MoodProgress-эквивалент, полный график
 * за неделю/месяц/год — экран /mood, вне фазы 2). Клик → /mood.
 */
export function MoodDashboard(): ReactElement {
  const { t } = useTranslation('moodAndEnergy');
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const loaded = useAppSelector(selectMoodLoaded);
  const { percents, filledValuesCount, allValuesCount } = useAppSelector(selectTodayMoodProgress);

  useEffect(() => {
    if (!loaded) {
      dispatch(loadMood());
    }
  }, [dispatch, loaded]);

  const clamped = Math.max(0, Math.min(1, percents / 100));
  const isComplete = percents === 100;

  return (
    <div
      className={styles.root}
      role="button"
      tabIndex={0}
      onClick={() => navigate('/mood')}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          navigate('/mood');
        }
      }}
    >
      <div className={styles.progressWrap}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} stroke="var(--ds-ground-600)" strokeWidth={TRACK_WIDTH} fill="none" />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke="var(--ds-calm-500)"
            strokeWidth={TRACK_WIDTH}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - clamped)}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        </svg>
        <span className={styles.progressLabel}>{`${Math.round(clamped * 100)}%`}</span>
      </div>
      <div className={styles.texts}>
        <p className={styles.mainText}>{isComplete ? t('progress.howAreYou') : t('progress.assess')}</p>
        {!isComplete ? (
          <p className={styles.subText}>{`${t('progress')} ${filledValuesCount}/${allValuesCount}`}</p>
        ) : null}
      </div>
    </div>
  );
}
