import { useMemo, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import type { TMemoryMoodItem } from '@entities/mood';
import styles from './MoodChart.module.css';

export type MoodChartProps = {
  data: TMemoryMoodItem[];
};

const WIDTH = 320;
const HEIGHT = 140;
const PAD_X = 8;
const PAD_Y = 12;
const SCALE_MAX = 10;

type SeriesKey = 'mood' | 'energy' | 'stress';
const SERIES: { key: SeriesKey; color: string }[] = [
  { key: 'mood', color: 'var(--ds-accent-400)' },
  { key: 'energy', color: 'var(--ds-calm-500)' },
  { key: 'stress', color: 'var(--ds-alarm-600)' },
];

function buildPoints(data: TMemoryMoodItem[], key: SeriesKey): { x: number; y: number }[] {
  const stepX = data.length > 1 ? (WIDTH - PAD_X * 2) / (data.length - 1) : 0;
  const points: { x: number; y: number }[] = [];
  data.forEach((item, index) => {
    const value = item[key];
    if (value === null || value === undefined) return;
    const x = PAD_X + stepX * index;
    const y = HEIGHT - PAD_Y - ((value / SCALE_MAX) * (HEIGHT - PAD_Y * 2));
    points.push({ x, y });
  });
  return points;
}

function toPolyline(points: { x: number; y: number }[]): string {
  return points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
}

/**
 * Простой SVG line-график без библиотек (DS §09): три линии (настроение
 * accent400 / энергия calm500 / стресс alarm600) за последние 7 дней. Пустые
 * значения (null) — точка пропускается (разрыв линии), без интерполяции.
 */
export function MoodChart({ data }: MoodChartProps): ReactElement {
  const { t } = useTranslation('moodAndEnergy');

  const series = useMemo(
    () => SERIES.map((s) => ({ ...s, points: buildPoints(data, s.key) })),
    [data],
  );

  const hasAnyData = series.some((s) => s.points.length > 0);

  return (
    <div className={styles.root}>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className={styles.svg} preserveAspectRatio="none" role="img" aria-label={t('chart.title')}>
        {[0.25, 0.5, 0.75].map((fraction) => (
          <line
            key={fraction}
            x1={PAD_X}
            x2={WIDTH - PAD_X}
            y1={PAD_Y + (HEIGHT - PAD_Y * 2) * fraction}
            y2={PAD_Y + (HEIGHT - PAD_Y * 2) * fraction}
            className={styles.gridLine}
          />
        ))}
        {hasAnyData
          ? series.map((s) =>
              s.points.length > 1 ? (
                <polyline key={s.key} points={toPolyline(s.points)} fill="none" stroke={s.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              ) : null,
            )
          : null}
        {hasAnyData
          ? series.map((s) =>
              s.points.map((p, i) => <circle key={`${s.key}-${i}`} cx={p.x} cy={p.y} r={2.5} fill={s.color} />),
            )
          : null}
      </svg>
      <div className={styles.legend}>
        {SERIES.map((s) => (
          <span key={s.key} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: s.color }} />
            {t(`name.${s.key}`)}
          </span>
        ))}
      </div>
    </div>
  );
}
