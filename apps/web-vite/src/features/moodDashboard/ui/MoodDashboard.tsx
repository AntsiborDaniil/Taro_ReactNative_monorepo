import { useEffect, type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  loadMood,
  MetricGlyph,
  selectMoodLoaded,
  selectTodayMoodProgress,
  selectTodayMoodValues,
  summaryKey,
  type MoodMetric,
} from '@entities/mood';
import { useAppDispatch, useAppSelector } from '@shared/lib/store';
import { ChevronRightIcon, Text } from '@shared/ui';
import styles from './MoodDashboard.module.css';

const METRICS: MoodMetric[] = ['mood', 'energy', 'stress'];
// Те же цвета, что на /mood и у линий MoodChart.
const COLOR: Record<MoodMetric, string> = {
  mood: 'var(--ds-accent-400)',
  energy: 'var(--ds-calm-500)',
  stress: 'var(--ds-action-500)',
};

/**
 * Виджет состояния на главной: три «живые» иконки метрик с сегодняшними
 * значениями. Не заполнено — приглашение «Как ты сегодня?» и пустые (пунктир)
 * метрики; заполнено — итог дня одной фразой (тот же summaryKey, что на /mood).
 * Клик → /mood.
 */
export function MoodDashboard(): ReactElement {
  const { t } = useTranslation('moodAndEnergy');
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const loaded = useAppSelector(selectMoodLoaded);
  const values = useAppSelector(selectTodayMoodValues);
  const { percents, filledValuesCount, allValuesCount } = useAppSelector(selectTodayMoodProgress);

  useEffect(() => {
    if (!loaded) {
      dispatch(loadMood());
    }
  }, [dispatch, loaded]);

  const isComplete = percents === 100;
  const summary =
    isComplete && values.mood != null && values.energy != null && values.stress != null
      ? summaryKey({ mood: values.mood, energy: values.energy, stress: values.stress })
      : null;

  return (
    <button type="button" className={styles.root} onClick={() => navigate('/mood')}>
      <span className={styles.head}>
        <span className={styles.headText}>
          <Text role="label" tone="accent" as="span">
            {t('widget.label')}
          </Text>
          <Text role="lead" tone="ink50" as="span">
            {summary ? t(`summary.${summary}.title`) : t('intro.title')}
          </Text>
        </span>
        <span className={styles.cta}>
          <Text role="micro" tone="ink100" as="span">
            {isComplete ? t('widget.open') : t('widget.progress', { filled: filledValuesCount, total: allValuesCount })}
          </Text>
          <ChevronRightIcon width={18} height={18} />
        </span>
      </span>
      <span className={styles.metrics}>
        {METRICS.map((metric) => {
          const value = values[metric];
          const unset = value == null;
          return (
            <span key={metric} className={[styles.metric, unset ? styles.metricUnset : ''].filter(Boolean).join(' ')}>
              <span className={styles.glyph} style={{ color: unset ? undefined : COLOR[metric] }}>
                <MetricGlyph metric={metric} value={value} size={24} />
              </span>
              <span className={styles.metricText}>
                <span className={styles.metricName}>{t(`name.${metric}`)}</span>
                <span className={styles.metricValue} style={{ color: unset ? undefined : COLOR[metric] }}>
                  {unset ? '—' : value}
                </span>
              </span>
            </span>
          );
        })}
      </span>
    </button>
  );
}
