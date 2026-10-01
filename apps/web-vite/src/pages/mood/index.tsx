import { useEffect, type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  loadMood,
  selectMoodLoaded,
  selectMoodWeekSeries,
  selectTodayMoodProgress,
  selectTodayMoodValues,
  setMoodValue,
  type TMoodItem,
} from '@entities/mood';
import { MoodChart } from '@features/moodDashboard';
import { MotivationKey } from '@entities/tarotMotivation';
import { useAppDispatch, useAppSelector } from '@shared/lib/store';
import { Button, Header, Slider, Text } from '@shared/ui';
import styles from './Mood.module.css';

const METRICS: Array<{ key: keyof TMoodItem }> = [{ key: 'mood' }, { key: 'energy' }, { key: 'stress' }];
const SCALE_MIN = 0;
const SCALE_MAX = 10;
const SIZE = 76;
const TRACK_WIDTH = 6;
const RADIUS = (SIZE - TRACK_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Перенос apps/web/src/pages/moodAndEnergy — три шага на одном экране: оценка
 * слайдерами (DS Slider), карта-подсказка (прогресс-кольцо + «Создать карту»
 * → /motivation, доступно при 100%) и график за 7 дней (MoodChart, SVG).
 */
export default function MoodPage(): ReactElement {
  const { t } = useTranslation('moodAndEnergy');
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const loaded = useAppSelector(selectMoodLoaded);
  const values = useAppSelector(selectTodayMoodValues);
  const { percents, filledValuesCount, allValuesCount } = useAppSelector(selectTodayMoodProgress);
  const weekSeries = useAppSelector(selectMoodWeekSeries);

  useEffect(() => {
    if (!loaded) dispatch(loadMood());
  }, [dispatch, loaded]);

  const isComplete = percents === 100;
  const clamped = Math.max(0, Math.min(1, percents / 100));

  return (
    <div className={styles.page}>
      <div className={styles.column}>
        <Header title={t('core:yourState')} />

        <div className={styles.intro}>
          <Text role="label" tone="accent" className={styles.eyebrow}>
            {t('intro.eyebrow')}
          </Text>
          <Text role="title" as="h1">
            {t('intro.title')}
          </Text>
          <Text role="body" tone="ink100">
            {t('intro.body')}
          </Text>
        </div>

        <section className={styles.section}>
          <div className={styles.stepHead}>
            <Text role="label" as="h2">
              {t('step.assess.title')}
            </Text>
            <span className={styles.badge}>{t('filled', { filled: filledValuesCount, total: allValuesCount })}</span>
          </div>
          <Text role="body" tone="ink100">
            {t('step.assess.hint')}
          </Text>
          <div className={styles.sliders}>
            {METRICS.map((metric) => (
              <Slider
                key={metric.key}
                label={t(`name.${metric.key}`)}
                hint={t(`hint.${metric.key}`)}
                value={values[metric.key] ?? SCALE_MIN}
                unset={values[metric.key] == null}
                min={SCALE_MIN}
                max={SCALE_MAX}
                step={1}
                onChange={(value) => dispatch(setMoodValue({ name: metric.key, value }))}
              />
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <Text role="label" as="h2">
            {t('step.card.title')}
          </Text>
          <Text role="body" tone="ink100">
            {t('step.card.hint')}
          </Text>
          <div className={styles.cardRow}>
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
            <div className={styles.cardTextCol}>
              <Text role="body" tone="ink50">
                {isComplete ? t('card.ready') : t('card.needMore', { filled: filledValuesCount, total: allValuesCount })}
              </Text>
              <Text role="label" tone="ink100">
                {t('card.cost')}
              </Text>
            </div>
          </div>
          <Button
            fullWidth
            disabled={!isComplete}
            onClick={() => navigate('/motivation', { state: { key: MotivationKey.MoodAndEnergy, params: values } })}
          >
            {t('progress.createCard')}
          </Button>
        </section>

        <section className={styles.section}>
          <Text role="label" as="h2">
            {t('step.chart.title')}
          </Text>
          <Text role="body" tone="ink100">
            {t('step.chart.hint')}
          </Text>
          <MoodChart data={weekSeries} />
        </section>
      </div>
    </div>
  );
}
