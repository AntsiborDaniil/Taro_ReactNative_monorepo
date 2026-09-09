import { Platform, SafeAreaView, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useMobileFabScrollOnScroll } from 'app/navigation/tabs/MobileFabScrollContext';
import { MoodDashboard } from 'features/MoodDashboard';
import { FAVORITE_SPREADS } from '../lib';
import { DeferredMount } from 'shared/lib/web/DeferredMount';
import { AnalyticAction } from 'shared/types';
import { MainSectionSkeleton, ScreenLayout } from 'shared/ui';
import { HabitWidget } from 'widgets/habitWidget';
import { DayAdvice } from './DayAdvice';
import { MainQuickLinks } from './MainQuickLinks';
import { TarotSpreadsCarousel } from './TarotSpreadsCarousel';
import { useMainLayout } from './useMainLayout';

function Main() {
  const { t } = useTranslation();
  const layout = useMainLayout();
  const { width } = useWindowDimensions();
  const isCompact = width < 430;
  const onFabScroll = useMobileFabScrollOnScroll();

  const popularSpreads = (
    <View style={styles.carouselPad}>
      <TarotSpreadsCarousel
        analyticAction={AnalyticAction.ClickPopularMainPage}
        spreads={FAVORITE_SPREADS}
        title={t('main:popularSpreads')}
        spaceBetween={isCompact ? 12 : 16}
      />
    </View>
  );

  return (
    <ScreenLayout>
      <ScrollView
        onScroll={onFabScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: layout.scrollBottomPad },
        ]}
      >
        <SafeAreaView
          style={[styles.safe, { marginBottom: layout.bottomMargin }]}
        >
          <View
            style={[
              styles.column,
              isCompact && styles.columnCompact,
              {
                maxWidth: layout.contentWidth,
                paddingHorizontal: layout.padding,
                gap: layout.sectionGap,
              },
            ]}
          >
            <View style={styles.decorGrid} />
            <View style={styles.sectionShell}>
              <DayAdvice />
            </View>
            {Platform.OS === 'web' ? (
              <>
                <View
                  style={[
                    styles.tarotCluster,
                    { gap: isCompact ? 6 : 8 },
                  ]}
                >
                  <DeferredMount delayMs={100} fallback={null}>
                    <MainQuickLinks />
                  </DeferredMount>
                  <View style={styles.sectionShell}>
                    <DeferredMount
                      delayMs={160}
                      fallback={<MainSectionSkeleton />}
                    >
                      {popularSpreads}
                    </DeferredMount>
                  </View>
                </View>
                <View style={styles.sectionShell}>
                  <DeferredMount
                    delayMs={240}
                    fallback={<MainSectionSkeleton />}
                  >
                    <HabitWidget />
                  </DeferredMount>
                </View>
                <View style={styles.sectionShell}>
                  <DeferredMount
                    delayMs={320}
                    fallback={<MainSectionSkeleton tall />}
                  >
                    <MoodDashboard isWidget horizontalInset={0} />
                  </DeferredMount>
                </View>
              </>
            ) : (
              <>
                <View
                  style={[
                    styles.tarotCluster,
                    { gap: isCompact ? 6 : 8 },
                  ]}
                >
                  <MainQuickLinks />
                  <View style={styles.sectionShell}>
                    {popularSpreads}
                  </View>
                </View>
                <View style={styles.sectionShell}>
                  <HabitWidget />
                </View>
                <View style={styles.sectionShell}>
                  <MoodDashboard isWidget horizontalInset={0} />
                </View>
              </>
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
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 20,
  },
  columnCompact: {
    borderRadius: 14,
    overflow: 'visible',
  },
  sectionShell: {
    borderWidth: 1,
    borderColor: 'rgba(246, 192, 27, 0.14)',
    borderRadius: 18,
    backgroundColor: 'rgba(30, 35, 43, 0.55)',
    overflow: 'hidden',
    width: '100%',
    maxWidth: '100%',
    ...(globalThis?.window
      ? ({
          boxShadow:
            '0 12px 28px rgba(8, 12, 20, 0.35), inset 0 1px 0 rgba(246, 192, 27, 0.06)',
        } as object)
      : {}),
  },
  tarotCluster: {
    width: '100%',
  },
  carouselPad: {
    paddingVertical: 12,
    width: '100%',
    maxWidth: '100%',
    overflow: 'hidden',
  },
  decorGrid: {
    position: 'absolute',
    right: 22,
    bottom: 40,
    width: 88,
    height: 88,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(246, 192, 27, 0.16)',
    backgroundColor: 'rgba(246, 192, 27, 0.03)',
  },
});
