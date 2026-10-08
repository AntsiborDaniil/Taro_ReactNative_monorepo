import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { loadMood, selectMoodLoaded } from '@entities/mood';
import { DAY_ADVICE_SPREAD, SpreadName, SuitBalance } from '@entities/spread';
import { useOpenFreePeriodCard } from '@features/freePeriodCard';
import { ensureI18nNamespaces } from '@shared/i18n';
import { useAppDispatch, useAppSelector } from '@shared/lib/store';
import { Button, ChevronLeftIcon, ChevronRightIcon, EmptyState, Header, Skeleton, Text } from '@shared/ui';
import { computeMirror, MIRROR_MIN_SPREADS } from './model/computeMirror';
import { useMirrorSpreads } from './model/useMirrorSpreads';
import { CardOfWeek } from './ui/CardOfWeek';
import { MirrorHero } from './ui/MirrorHero';
import { MoodSummary } from './ui/MoodSummary';
import { ReversedRing } from './ui/ReversedRing';
import { WeekDays } from './ui/WeekDays';
import styles from './Mirror.module.css';

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_WEEKS_BACK = 12;

/**
 * «Зеркало недели» — экран без LLM: итог недели (доминирующая масть + плитки),
 * карта недели, все карты по дням рядом с отметками настроения, баланс мастей,
 * перевёрнутые и состояние недели с совпадениями «масть ↔ настроение».
 * Всё считается на клиенте (computeMirror) из облачной/локальной истории и /mood.
 * Показывается с первого расклада; до 3 раскладов — мягкая подсказка о точности.
 */
export default function MirrorPage(): ReactElement {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const [weeksBack, setWeeksBack] = useState(0);

  const moods = useAppSelector((state) => state.mood.allMoods);
  const moodLoaded = useAppSelector(selectMoodLoaded);
  const hasReversed = useAppSelector((state) => state.settings.settings.spread?.hasReversed ?? true);

  useEffect(() => {
    if (!moodLoaded) dispatch(loadMood());
  }, [dispatch, moodLoaded]);

  // Названия и ключевые слова карт — в ленивом card.json.
  const [namesReady, setNamesReady] = useState(false);
  useEffect(() => {
    let alive = true;
    void ensureI18nNamespaces('card').then(() => {
      if (alive) setNamesReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  // Конец окна — сегодня минус N недель; пересчитываем только при смене недели.
  const endDate = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - weeksBack * 7);
    return d;
  }, [weeksBack]);
  const rangeStart = useMemo(() => new Date(endDate.getTime() - 6 * DAY_MS), [endDate]);

  const { spreads, loading } = useMirrorSpreads(rangeStart);
  const result = useMemo(() => computeMirror({ spreads, moods, endDate }), [spreads, moods, endDate]);

  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'short' }),
    [i18n.language],
  );
  const rangeLabel = `${dateFormatter.format(result.rangeStart)} – ${dateFormatter.format(result.rangeEnd)}`;
  const isCurrentWeek = weeksBack === 0;
  const hasData = result.spreadsCount > 0;

  // «Карта месяца» — вытянутый расклад месяца того месяца, к которому относится окно.
  const monthCard = useMemo(() => {
    const y = endDate.getFullYear();
    const m = endDate.getMonth();
    const found = spreads
      .filter((sp) => sp.id === SpreadName.Period_MonthCard && sp.date && sp.selectedCards?.[0])
      .find((sp) => {
        const d = new Date(sp.date as string);
        return d.getFullYear() === y && d.getMonth() === m && d.getTime() <= endDate.getTime() + DAY_MS;
      });
    const card = found?.selectedCards?.[0];
    return card ? { cardId: String(card.id), direction: card.direction } : null;
  }, [spreads, endDate]);
  const monthLabel = useMemo(
    () => new Intl.DateTimeFormat(i18n.language, { month: 'long' }).format(endDate),
    [i18n.language, endDate],
  );

  // «Карта дня» — сразу в расклад (или к уже вытянутой сегодня), как с главной.
  const { open: openFreeCard } = useOpenFreePeriodCard();
  const openDayCard = () => openFreeCard(DAY_ADVICE_SPREAD);
  const precise = result.spreadsCount >= MIRROR_MIN_SPREADS;

  return (
    <div className={styles.page}>
      <div className={styles.column}>
        <Header title={t('main:mirror.title')} />

        <div className={styles.weekNav}>
          <button
            type="button"
            className={styles.weekButton}
            onClick={() => setWeeksBack((prev) => Math.min(MAX_WEEKS_BACK, prev + 1))}
            disabled={weeksBack >= MAX_WEEKS_BACK}
            aria-label={t('main:mirror.week.prev')}
          >
            <ChevronLeftIcon width={20} height={20} />
          </button>
          <Text role="micro" tone="ink100" as="span">
            {rangeLabel}
          </Text>
          <button
            type="button"
            className={styles.weekButton}
            onClick={() => setWeeksBack((prev) => Math.max(0, prev - 1))}
            disabled={isCurrentWeek}
            aria-label={t('main:mirror.week.next')}
          >
            <ChevronRightIcon width={20} height={20} />
          </button>
        </div>

        {loading ? (
          <div className={styles.skeletons}>
            <Skeleton height={140} radius={18} />
            <Skeleton height={120} radius={18} />
          </div>
        ) : !hasData ? (
          <EmptyState
            title={isCurrentWeek ? t('main:mirror.empty.first') : t('main:mirror.empty.past')}
            action={
              isCurrentWeek ? <Button onClick={openDayCard}>{t('main:mirror.empty.cta')}</Button> : undefined
            }
          />
        ) : (
          <>
            <MirrorHero result={result} showReversed={hasReversed} />
            {!precise && isCurrentWeek ? (
              <div className={styles.precision}>
                <div
                  className={styles.progress}
                  role="img"
                  aria-label={t('main:mirror.empty.progress', { done: result.spreadsCount, total: MIRROR_MIN_SPREADS })}
                >
                  {Array.from({ length: MIRROR_MIN_SPREADS }).map((_, index) => (
                    <span
                      key={index}
                      className={[styles.progressSegment, index < result.spreadsCount ? styles.progressSegmentOn : '']
                        .filter(Boolean)
                        .join(' ')}
                    />
                  ))}
                </div>
                <Text role="micro" tone="ink100">
                  {t('main:mirror.precision', { count: result.missingSpreads })}
                </Text>
              </div>
            ) : null}
            {result.cardOfWeek ? (
              <CardOfWeek
                card={result.cardOfWeek}
                direction={result.cardOfWeekDirection}
                caption={result.cardOfWeekSource === 'drawn' ? t('main:mirror.cardOfWeek.drawn') : undefined}
                repeats={result.frequent.filter((c) => c.cardId !== result.cardOfWeek?.cardId)}
                namesReady={namesReady}
              />
            ) : null}
            {monthCard ? (
              <CardOfWeek
                title={t('main:mirror.cardOfMonth.title')}
                card={{ cardId: monthCard.cardId, count: 1 }}
                direction={monthCard.direction}
                caption={t('main:mirror.cardOfMonth.caption', { month: monthLabel })}
                repeats={[]}
                namesReady={namesReady}
              />
            ) : null}
            <WeekDays days={result.days} />
            <section className={styles.section}>
              <Text role="label" tone="accent" as="h2" className={styles.sectionTitle}>
                {t('main:mirror.suits.title')}
              </Text>
              <SuitBalance counts={result.suitCounts} />
            </section>
            {hasReversed ? <ReversedRing percent={result.reversedPercent} /> : null}
            <MoodSummary result={result} />
          </>
        )}
      </div>
    </div>
  );
}
