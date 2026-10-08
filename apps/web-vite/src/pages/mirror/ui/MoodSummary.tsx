import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Text } from '@shared/ui';
import { MIRROR_MIN_MOOD_DAYS, type MirrorResult } from '../model/computeMirror';
import styles from '../Mirror.module.css';

const METRICS = ['mood', 'energy', 'stress'] as const;
const SCALE_MAX = 10;

/**
 * «Состояние недели»: средние настроения/энергии/стресса (шкала 0–10, как на /mood)
 * с первой же отметки, затем — совпадения «масть ↔ настроение», когда дней хватает.
 * Формулировки без причинности — только «в дни с…»; оговорка «не о причинах» — только под связями.
 */
export function MoodSummary({ result }: { result: MirrorResult }): ReactElement {
  const { t } = useTranslation();
  const hasAny = result.moodDaysCount > 0;
  const missingDays = Math.max(0, MIRROR_MIN_MOOD_DAYS - result.moodDaysCount);

  return (
    <section className={styles.section}>
      <Text role="label" tone="accent" as="h2" className={styles.sectionTitle}>
        {t('main:mirror.mood.title')}
      </Text>

      {hasAny ? (
        <div className={styles.metrics}>
          {METRICS.map((metric) => {
            const value = result.moodAverages[metric];
            return (
              <div key={metric} className={styles.metricRow}>
                <Text role="body" tone="ink50" as="span" className={styles.metricName}>
                  {t(`main:mirror.metricName.${metric}`)}
                </Text>
                <span className={styles.metricTrack} aria-hidden="true">
                  <span
                    className={[styles.metricFill, metric === 'stress' ? styles.metricFillStress : ''].join(' ')}
                    style={{ width: `${((value ?? 0) / SCALE_MAX) * 100}%` }}
                  />
                </span>
                <Text role="label" tone="ink100" as="span" className={styles.metricValue}>
                  {value != null ? value : '—'}
                </Text>
              </div>
            );
          })}
          <Text role="micro" tone="ink100">
            {t('main:mirror.mood.days', { count: result.moodDaysCount })}
          </Text>
        </div>
      ) : null}

      {result.insights.map((insight) => (
        <div key={`${insight.suit}-${insight.metric}`} className={styles.insightCard}>
          <Text role="body" tone="ink50" className={styles.insightText}>
            {t('main:mirror.mood.insight', {
              suit: t(`main:mirror.suit.with.${insight.suit}`),
              metric: t(`main:mirror.metric.${insight.metric}`),
              direction: t(insight.higher ? 'main:mirror.mood.higher' : 'main:mirror.mood.lower'),
              a: insight.withAvg,
              b: insight.withoutAvg,
            })}
          </Text>
        </div>
      ))}

      {result.insights.length === 0 ? (
        <Text role="body" tone="ink100" as="p" className={styles.moodHint}>
          {/* Ссылка — прямо в тексте («Отметь состояние ещё 2 дня…»), без отдельной строки. */}
          {missingDays > 0 ? (
            <>
              <Link to="/mood" className={styles.textLink}>
                {t('main:mirror.mood.needDaysLink')}
              </Link>{' '}
              {t('main:mirror.mood.needDays', { count: missingDays })}
            </>
          ) : (
            <>
              {t('main:mirror.mood.noPattern')}{' '}
              <Link to="/mood" className={styles.textLink}>
                {t('main:mirror.mood.noPatternLink')}
              </Link>
              .
            </>
          )}
        </Text>
      ) : (
        <Text role="micro" tone="ink100" className={styles.disclaimer}>
          {t('main:mirror.disclaimer')}
        </Text>
      )}
    </section>
  );
}
