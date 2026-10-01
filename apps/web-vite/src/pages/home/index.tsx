import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { FAVORITE_SPREADS } from '@entities/spread';
import { DeferredMount } from '@shared/lib/DeferredMount';
import { HabitWidget } from '@widgets/habitWidget';
import { MoodDashboard } from '@features/moodDashboard';
import { DayAdvice } from './ui/DayAdvice';
import { MainQuickLinks } from './ui/MainQuickLinks';
import { TarotSpreadsCarousel } from './ui/TarotSpreadsCarousel';
import { QuickLinksSkeleton, SpreadsSkeleton, WidgetSkeleton } from './ui/MainSkeletons';
import styles from './Home.module.css';

/**
 * Перенос apps/web/src/pages/main (Main.tsx + useMainLayout) — раскладка
 * mobile-в-один-столбец / desktop 7:5 сделана через CSS Grid + container query
 * `mainCol` (объявлен на .root ниже), а не JS-замер ширины контейнера: секции
 * занимают grid-area независимо от DOM-порядка, поэтому на десктопе «Карта
 * дня» + «Популярные расклады» уходят в левую колонку (7), «Быстрые ссылки» +
 * виджеты — в правую (5), при этом DOM-порядок остаётся как на мобильном
 * (доступность и порядок табуляции не ломаются).
 */
export default function HomePage(): ReactElement {
  const { t } = useTranslation();

  return (
    <div className={styles.root}>
      <div className={styles.inner}>
        <div className={styles.layout}>
          <div className={styles.day}>
            <DayAdvice />
          </div>
          <div className={styles.quick}>
            <DeferredMount delayMs={100} fallback={<QuickLinksSkeleton />}>
              <MainQuickLinks />
            </DeferredMount>
          </div>
          <div className={styles.spreads}>
            <DeferredMount delayMs={160} fallback={<SpreadsSkeleton />}>
              <TarotSpreadsCarousel title={t('main:popularSpreads')} spreads={FAVORITE_SPREADS} />
            </DeferredMount>
          </div>
          <div className={styles.habits}>
            <DeferredMount delayMs={240} fallback={<WidgetSkeleton />}>
              <HabitWidget />
            </DeferredMount>
          </div>
          <div className={styles.mood}>
            <DeferredMount delayMs={320} fallback={<WidgetSkeleton tall />}>
              <MoodDashboard />
            </DeferredMount>
          </div>
        </div>
      </div>
    </div>
  );
}
