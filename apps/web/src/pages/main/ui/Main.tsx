import { useCallback, useState } from 'react';
import {
  type LayoutChangeEvent,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useMobileFabScrollOnScroll } from 'app/navigation/tabs/MobileFabScrollContext';
import { MoodDashboard } from 'features/MoodDashboard';
import { FAVORITE_SPREADS } from '../lib';
import { DeferredMount } from 'shared/lib/web/DeferredMount';
import { AnalyticAction } from 'shared/types';
import { ScreenLayout } from 'shared/ui';
import { DS_COLORS, DS_LAYOUT, DS_SIZES, DS_SPACE } from 'shared/themes/ds';
import { HabitWidget } from 'widgets/habitWidget';
import { DayAdvice } from './DayAdvice';
import { MainQuickLinks } from './MainQuickLinks';
import { QuickLinksSkeleton, SpreadsSkeleton, WidgetSkeleton } from './MainSkeletons';
import { TarotSpreadsCarousel } from './TarotSpreadsCarousel';
import { useMainLayout } from './useMainLayout';

const isWeb = Platform.OS === 'web';

function Main() {
  const { t } = useTranslation();
  const [containerWidth, setContainerWidth] = useState(0);
  const layout = useMainLayout(containerWidth);
  const onFabScroll = useMobileFabScrollOnScroll();

  // Ширина контейнера колонки (не окна) — на ≥900 слева рейка навигации
  // 76–228 px, поэтому useWindowDimensions даёт лишние пиксели и ломает
  // 2-колоночную раскладку. Меряем то, что реально осталось под контент.
  const handleContainerLayout = useCallback((event: LayoutChangeEvent) => {
    const w = event.nativeEvent.layout.width;
    if (w > 0) {
      setContainerWidth((prev) => (prev === w ? prev : w));
    }
  }, []);

  const renderQuickLinks = () =>
    isWeb ? (
      <DeferredMount delayMs={100} fallback={<QuickLinksSkeleton />}>
        <MainQuickLinks />
      </DeferredMount>
    ) : (
      <MainQuickLinks />
    );

  const renderSpreads = () =>
    isWeb ? (
      <DeferredMount delayMs={160} fallback={<SpreadsSkeleton />}>
        <TarotSpreadsCarousel
          analyticAction={AnalyticAction.ClickPopularMainPage}
          spreads={FAVORITE_SPREADS}
          title={t('main:popularSpreads')}
        />
      </DeferredMount>
    ) : (
      <TarotSpreadsCarousel
        analyticAction={AnalyticAction.ClickPopularMainPage}
        spreads={FAVORITE_SPREADS}
        title={t('main:popularSpreads')}
      />
    );

  const renderHabits = () => (
    <View style={styles.widgetSeparated}>
      {isWeb ? (
        <DeferredMount delayMs={240} fallback={<WidgetSkeleton />}>
          <HabitWidget />
        </DeferredMount>
      ) : (
        <HabitWidget />
      )}
    </View>
  );

  const renderMood = () => (
    <View style={styles.widgetSeparated}>
      {isWeb ? (
        <DeferredMount delayMs={320} fallback={<WidgetSkeleton tall />}>
          <MoodDashboard isWidget horizontalInset={0} />
        </DeferredMount>
      ) : (
        <MoodDashboard isWidget horizontalInset={0} />
      )}
    </View>
  );

  return (
    <ScreenLayout style={{ backgroundColor: DS_COLORS.ground900 }}>
      <ScrollView
        onScroll={onFabScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: layout.scrollBottomPad + DS_SPACE.xxl },
        ]}
      >
        <SafeAreaView style={styles.safe} onLayout={handleContainerLayout}>
          <View
            style={[
              styles.column,
              {
                maxWidth: layout.maxWidth,
                paddingHorizontal: layout.gutter,
                paddingTop: DS_SPACE.xl,
              },
            ]}
          >
            {layout.isTwoColumn ? (
              <View style={[styles.desktopRow, { gap: DS_LAYOUT.columnGap }]}>
                <View style={[styles.desktopColumnPrimary, { gap: layout.sectionGap }]}>
                  <DayAdvice viewport={layout.viewport} />
                  {renderSpreads()}
                </View>
                <View style={[styles.desktopColumnSecondary, { gap: layout.sectionGap }]}>
                  {renderQuickLinks()}
                  {renderHabits()}
                  {renderMood()}
                </View>
              </View>
            ) : (
              <View style={{ gap: layout.sectionGap }}>
                <DayAdvice viewport={layout.viewport} />
                {renderQuickLinks()}
                {renderSpreads()}
                {renderHabits()}
                {renderMood()}
              </View>
            )}
          </View>
        </SafeAreaView>
      </ScrollView>
    </ScreenLayout>
  );
}

export default Main;

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  safe: {
    width: '100%',
    alignItems: 'center',
  },
  column: {
    width: '100%',
    flexDirection: 'column',
  },
  desktopRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  desktopColumnPrimary: {
    flex: 7,
    minWidth: 0,
    flexDirection: 'column',
    paddingTop: 0,
  },
  desktopColumnSecondary: {
    flex: 5,
    minWidth: 0,
    flexDirection: 'column',
    paddingTop: 0,
  },
  /** Виджеты без внешней карточки: разделитель 1px ground-600 отделяет их от предыдущей секции. */
  widgetSeparated: {
    borderTopWidth: DS_SIZES.hairline,
    borderTopColor: DS_COLORS.ground600,
    paddingTop: DS_SPACE.l,
  },
});
