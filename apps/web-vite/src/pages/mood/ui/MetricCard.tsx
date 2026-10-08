import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Slider, Text } from '@shared/ui';
import { levelOf, MetricGlyph, type MoodMetric } from '@entities/mood';
import styles from '../Mood.module.css';

// Цвета — как у линий MoodChart: настроение accent, энергия calm, стресс action.
const TONE: Record<MoodMetric, 'calm' | 'accent' | 'action'> = {
  mood: 'accent',
  energy: 'calm',
  stress: 'action',
};

const COLOR: Record<MoodMetric, string> = {
  mood: 'var(--ds-accent-400)',
  energy: 'var(--ds-calm-500)',
  stress: 'var(--ds-action-500)',
};

type MetricCardProps = {
  metric: MoodMetric;
  value: number | null;
  min: number;
  max: number;
  onChange: (value: number) => void;
};

/** Карточка одной метрики: живая иконка, название, слово-состояние, крупное число и ползунок своего цвета. */
export function MetricCard({ metric, value, min, max, onChange }: MetricCardProps): ReactElement {
  const { t } = useTranslation('moodAndEnergy');
  const unset = value == null;

  return (
    <div className={[styles.metric, unset ? styles.metricUnset : ''].filter(Boolean).join(' ')}>
      <div className={styles.metricHead}>
        <span className={styles.glyph} style={{ color: COLOR[metric] }}>
          <MetricGlyph metric={metric} value={value} />
        </span>
        <span className={styles.metricText}>
          <Text role="lead" tone="ink50" as="span">
            {t(`name.${metric}`)}
          </Text>
          <Text role="micro" tone="ink100" as="span">
            {unset ? t('word.unset') : t(`word.${metric}.${levelOf(value)}`)}
          </Text>
        </span>
        <span className={styles.metricValue} style={{ color: unset ? undefined : COLOR[metric] }}>
          {unset ? '—' : value}
        </span>
      </div>
      <Slider
        compact
        label={t(`name.${metric}`)}
        value={value ?? min}
        unset={unset}
        min={min}
        max={max}
        step={1}
        tone={TONE[metric]}
        onChange={onChange}
      />
      <div className={styles.scale} aria-hidden="true">
        <Text role="micro" tone="ink100" as="span">
          {t(`scale.${metric}.min`)}
        </Text>
        <Text role="micro" tone="ink100" as="span">
          {t(`scale.${metric}.max`)}
        </Text>
      </div>
    </div>
  );
}
