import { useEffect, useRef, type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  loadMood,
  selectMoodLoaded,
  selectMoodWeekSeries,
  selectTodayMoodProgress,
  selectTodayMoodValues,
  setMoodValue,
  summaryKey,
  type MoodMetric,
} from '@entities/mood';
import { TarotCardFace } from '@entities/spread';
import { MoodChart } from '@features/moodDashboard';
import { getMotivationMemoryKey, MotivationKey } from '@entities/tarotMotivation';
import { haptic } from '@shared/lib/haptics';
import { MetrikaGoal, reachMetrikaGoal } from '@shared/lib/metrika';
import { useAppDispatch, useAppSelector } from '@shared/lib/store';
import { Button, ChargeMark, Header, openModal, Text } from '@shared/ui';
import { MetricCard } from './ui/MetricCard';
import styles from './Mood.module.css';

const METRICS: MoodMetric[] = ['mood', 'energy', 'stress'];
const SCALE_MIN = 0;
const SCALE_MAX = 10;
const SIZE = 72;
const TRACK_WIDTH = 6;
const RADIUS = (SIZE - TRACK_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function greetingKey(hour: number): string {
  if (hour < 5) return 'night';
  if (hour < 12) return 'morning';
  if (hour < 18) return 'day';
  return 'evening';
}

/**
 * Дневник состояния: приветствие + кольцо «n из 3» и итог дня одной фразой (без
 * LLM), три карточки метрик с «живыми» иконками и словом-состоянием, карта-подсказка
 * (→ /motivation, бесплатно, при всех трёх оценках) и график за 7 дней.
 */
export default function MoodPage(): ReactElement {
  const { t } = useTranslation('moodAndEnergy');
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const loaded = useAppSelector(selectMoodLoaded);
  const values = useAppSelector(selectTodayMoodValues);
  const { percents, filledValuesCount, allValuesCount } = useAppSelector(selectTodayMoodProgress);
  const weekSeries = useAppSelector(selectMoodWeekSeries);
  const isAuthenticated = useAppSelector((state) => state.user.isAuthenticated);
  const tarotDaily = useAppSelector((state) => state.user.tarotDaily);
  const spreadCredits = useAppSelector((state) => state.user.spreadCredits);
  // Карта на сегодня уже получена (кэш на день) — открываем её, заряд не нужен.
  const hasTodayCard = (() => {
    try {
      return Boolean(window.localStorage.getItem(getMotivationMemoryKey(MotivationKey.MoodAndEnergy)));
    } catch {
      return false;
    }
  })();

  useEffect(() => {
    if (!loaded) dispatch(loadMood());
  }, [dispatch, loaded]);

  const isComplete = percents === 100;

  // mood_checkin — только момент заполнения всех метрик (не уже заполненный день при заходе).
  const wasCompleteRef = useRef<boolean | null>(null);
  useEffect(() => {
    if (!loaded) return;
    if (wasCompleteRef.current === false && isComplete) {
      reachMetrikaGoal(MetrikaGoal.moodCheckin, { filled: filledValuesCount });
    }
    wasCompleteRef.current = isComplete;
  }, [loaded, isComplete, filledValuesCount]);
  const clamped = Math.max(0, Math.min(1, percents / 100));
  const summary =
    isComplete && values.mood != null && values.energy != null && values.stress != null
      ? summaryKey({ mood: values.mood, energy: values.energy, stress: values.stress })
      : null;
  const missing = METRICS.filter((m) => values[m] == null).map((m) => t(`name.${m}`).toLowerCase());

  return (
    <div className={styles.page}>
      <div className={styles.column}>
        <Header title={t('core:yourState')} />

        <section className={styles.hero}>
          <div className={styles.heroText}>
            <Text role="label" tone="accent" as="p">
              {t(`greeting.${greetingKey(new Date().getHours())}`)}
            </Text>
            <Text role="title" tone="ink50" as="h1">
              {summary ? t(`summary.${summary}.title`) : t('intro.title')}
            </Text>
            <Text role="body" tone="ink100" as="p">
              {summary ? t(`summary.${summary}.text`) : t('intro.body')}
            </Text>
          </div>
          <div className={styles.ring} role="img" aria-label={t('filled', { filled: filledValuesCount, total: allValuesCount })}>
            <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
              <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} stroke="var(--ds-ground-600)" strokeWidth={TRACK_WIDTH} fill="none" />
              <circle
                className={styles.ringArc}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                stroke="var(--ds-accent-400)"
                strokeWidth={TRACK_WIDTH}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={CIRCUMFERENCE * (1 - clamped)}
                transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
              />
            </svg>
            <span className={styles.ringLabel}>
              {filledValuesCount}/{allValuesCount}
            </span>
          </div>
        </section>

        <section className={styles.metrics} aria-label={t('step.assess.title')}>
          {METRICS.map((metric) => (
            <MetricCard
              key={metric}
              metric={metric}
              value={values[metric]}
              min={SCALE_MIN}
              max={SCALE_MAX}
              onChange={(value) => {
                if (value !== values[metric]) haptic.selection();
                dispatch(setMoodValue({ name: metric, value }));
              }}
            />
          ))}
        </section>

        <section className={[styles.oracle, isComplete ? styles.oracleReady : ''].filter(Boolean).join(' ')}>
          <span className={styles.oracleCard}>
            <TarotCardFace faceDown />
          </span>
          <div className={styles.oracleText}>
            <Text role="label" tone="accent" as="h2">
              {t('step.card.title')}
            </Text>
            <Text role="body" tone="ink100" as="p">
              {isComplete ? t('card.ready') : t('card.missing', { list: missing.join(', ') })}
            </Text>
          </div>
          <Button
            fullWidth
            className={styles.oracleCta}
            disabled={!isComplete}
            icon={hasTodayCard ? undefined : <ChargeMark size="md" onAction={isComplete} />}
            iconPosition="end"
            aria-label={hasTodayCard ? undefined : `${t('progress.openCard')}, ${t('core:charge.a11y', { count: 1 })}`}
            onClick={() => {
              // Зарядов нет — сразу лист «Расклад на сегодня уже сделан», а не ошибка после перехода.
              if (!hasTodayCard && isAuthenticated && tarotDaily) {
                const remaining = Math.max(0, tarotDaily.limit - tarotDaily.used) + (spreadCredits ?? 0);
                if (remaining < 1) {
                  dispatch(openModal({ id: 'out-of-charges' }));
                  return;
                }
              }
              haptic.impact('medium');
              reachMetrikaGoal(MetrikaGoal.moodCardOpen);
              navigate('/motivation', { state: { key: MotivationKey.MoodAndEnergy, params: values } });
            }}
          >
            {hasTodayCard ? t('progress.openTodayCard') : t('progress.openCard')}
          </Button>
        </section>

        <section className={styles.chartCard}>
          <div className={styles.chartHead}>
            <Text role="label" tone="accent" as="h2">
              {t('step.chart.title')}
            </Text>
            <Text role="micro" tone="ink100" as="p">
              {t('step.chart.hint')}
            </Text>
          </div>
          <MoodChart data={weekSeries} />
        </section>
      </div>
    </div>
  );
}
