import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { FAVORITE_SPREADS } from '@entities/spread';
import { DeferredMount } from '@shared/lib/DeferredMount';
import { useAppDispatch, useAppSelector } from '@shared/lib/store';
import { AnalyticAction, track } from '@shared/lib/analytics';
import { Button, LightningIcon, openModal } from '@shared/ui';
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
 * занимают grid-area независимо от DOM-порядка. На десктопе «Карта дня» и
 * правая колонка (.side) — одна строка с равной высотой; карусель раскладов
 * во всю ширину ниже. На мобилке .side = display:contents, порядок areas
 * day → quick → spreads → habits → mood сохраняется.
 */
export default function HomePage(): ReactElement {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.user.isAuthenticated);

  const handleBuyCredits = () => {
    track(AnalyticAction.ClickSettingsSegment, { segment: 'credits.buy.home' });
    dispatch(openModal({ id: 'buy-credits' }));
  };

  return (
    <div className={styles.root}>
      <div className={styles.inner}>
        <div className={styles.layout}>
          <div className={styles.day}>
            <DayAdvice />
          </div>
          {/*
            .side: на мобилке display:contents — quick/habits/mood остаются
            отдельными grid-area (порядок day → quick → spreads → habits → mood).
            На десктопе — одна колонка той же высоты, что и «Карта дня».
          */}
          <div className={styles.side}>
            <div className={styles.quick}>
              <DeferredMount delayMs={100} fallback={<QuickLinksSkeleton />}>
                <MainQuickLinks />
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
          <div className={styles.spreads}>
            <DeferredMount delayMs={160} fallback={<SpreadsSkeleton />}>
              <TarotSpreadsCarousel title={t('main:popularSpreads')} spreads={FAVORITE_SPREADS} />
            </DeferredMount>
            {isAuthenticated ? (
              <Button
                variant="quiet"
                quietTone="accent"
                fullWidth
                className={styles.buyCredits}
                icon={<LightningIcon width={18} height={18} />}
                onClick={handleBuyCredits}
              >
                {t('main:buyCredits.cta')}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
