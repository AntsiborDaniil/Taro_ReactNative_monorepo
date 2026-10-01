import { useState, type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DAY_ADVICE_SPREAD, selectSpread } from '@entities/spread';
import { useAppDispatch } from '@shared/lib/store';
import { getCurrentDate } from '@shared/lib/date';
import { getImage } from '@shared/lib/getImage';
import { AnalyticAction, track } from '@shared/lib/analytics';
import { MetrikaGoal, reachMetrikaGoal } from '@shared/lib/metrika';
import { ChevronRightIcon, SmartImage } from '@shared/ui';
import styles from './DayAdvice.module.css';

function capitalizeFirst(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

/**
 * Перенос apps/web/src/pages/main/ui/DayAdvice (1-в-1 логика: клик выбирает
 * расклад «Совет дня» и ведёт на /spreads/simple_daySuggest — сам экран
 * расклада появится в фазе 3). Раскладка mobile/desktop — через container
 * query `mainCol` (объявлен на странице Home), а не JS-замер ширины: при
 * <1024 картинка сверху со срезом снизу, при >=1024 — картинка справа 40%.
 * Вход «прорисовки грани» — CSS keyframes (stroke-dashoffset 400мс), без reanimated.
 */
export function DayAdvice(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dateLabel = capitalizeFirst(getCurrentDate('badge'));
  const girlImage = getImage(['core', 'girl']);

  const handleSelect = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    track(AnalyticAction.ClickDayCard);
    dispatch(selectSpread(DAY_ADVICE_SPREAD));
    reachMetrikaGoal(MetrikaGoal.spreadStarted, { spreadId: DAY_ADVICE_SPREAD.id });
    // «Совету дня» вопрос не нужен — сразу к выбору карты, без промежуточного экрана.
    navigate('/reading');
  };

  return (
    <button
      type="button"
      className={styles.card}
      onClick={handleSelect}
      disabled={isSubmitting}
      aria-busy={isSubmitting || undefined}
      aria-label={t('main:dayCard.a11y', { date: dateLabel })}
    >
      {/*
        .frame — отдельный слой ВНУТРИ .card: .card задаёт container-type
        (контекст для cqw у потомков), а бордер/радиус/overflow — на .frame,
        иначе border-radius:4cqw на самом контейнере резолвится от ближайшего
        ancestor-контейнера (колонка ~1100px), а не от своей же ширины
        (~650px) — см. CardFrame/imageFrame для того же паттерна.
      */}
      <span className={styles.frame}>
        <span className={styles.imageCol}>
          <SmartImage className={styles.image} src={girlImage} lazy={false} />
          <svg className={`${styles.edge} ${styles.edgeStacked}`} preserveAspectRatio="none" viewBox="0 0 100 100.01">
            <line className={styles.edgeLine} x1="0" y1="100" x2="100" y2="80.65" pathLength={1} vectorEffect="non-scaling-stroke" />
          </svg>
          <svg className={`${styles.edge} ${styles.edgeRow}`} preserveAspectRatio="none" viewBox="0 0 28 100">
            <line className={styles.edgeLine} x1="28" y1="0" x2="0" y2="100" pathLength={1} vectorEffect="non-scaling-stroke" />
          </svg>
        </span>
        <span className={styles.content}>
          <span className={styles.textCol}>
            <span className={`${styles.title} ${styles.entryTitle}`}>{t('core:dailyCard.title')}</span>
            <span className={`${styles.dateLeadGroup} ${styles.entryText}`}>
              <span className={styles.dateText}>{dateLabel}</span>
              <span className={styles.lead}>{t('main:dayCard.lead')}</span>
            </span>
          </span>
          <span className={`${styles.cta} ${styles.entryCta} ${isSubmitting ? styles.ctaLoading : ''}`}>
            <span className={styles.ctaText}>{t('main:dayCard.cta')}</span>
            <ChevronRightIcon width={18} height={18} className={styles.ctaIcon} />
          </span>
        </span>
      </span>
    </button>
  );
}
