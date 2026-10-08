import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Text } from '@shared/ui';
import styles from '../Mirror.module.css';

const SIZE = 64;
const TRACK_WIDTH = 6;
const RADIUS = (SIZE - TRACK_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Блок «Перевёрнутые»: кольцо 64px (как прогресс на /mood) и подпись. */
export function ReversedRing({ percent }: { percent: number }): ReactElement {
  const { t } = useTranslation();
  const clamped = Math.max(0, Math.min(1, percent / 100));

  return (
    <section className={styles.section}>
      <Text role="label" tone="accent" as="h2" className={styles.sectionTitle}>
        {t('main:mirror.reversed.title')}
      </Text>
      <div className={styles.reversedRow}>
        <div className={styles.ringWrap}>
          <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
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
          <span className={styles.ringLabel} aria-hidden="true">{`${Math.round(clamped * 100)}%`}</span>
        </div>
        <Text role="body">{t('main:mirror.reversed.text', { percent: Math.round(clamped * 100) })}</Text>
      </div>
    </section>
  );
}
