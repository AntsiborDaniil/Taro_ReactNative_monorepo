import { Platform, SafeAreaView, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useMobileFabScrollOnScroll } from 'app/navigation/tabs/MobileFabScrollContext';
import { MoodDashboard } from 'features/MoodDashboard';
import { DeferredMount } from 'shared/lib/web/DeferredMount';
import { MainSectionSkeleton, ScreenLayout } from 'shared/ui';
import { HabitWidget } from 'widgets/habitWidget';
import { AffirmationsBlock } from './AffirmationsBlock';
import { DayAdvice } from './DayAdvice';
import { useMainLayout } from './useMainLayout';

function Main() {
  const layout = useMainLayout();
  const { width } = useWindowDimensions();
  const isCompact = width < 430;
  const onFabScroll = useMobileFabScrollOnScroll();

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
                <View style={styles.sectionShell}>
                  <DeferredMount
                    delayMs={120}
                    fallback={<MainSectionSkeleton />}
                  >
                    <HabitWidget />
                  </DeferredMount>
                </View>
                <View style={styles.sectionShell}>
                  <DeferredMount
                    delayMs={240}
                    fallback={<MainSectionSkeleton tall />}
                  >
                    <MoodDashboard isWidget horizontalInset={0} />
                  </DeferredMount>
                </View>
                <View style={styles.sectionShell}>
                  <DeferredMount
                    delayMs={360}
                    fallback={<MainSectionSkeleton />}
                  >
                    <AffirmationsBlock />
                  </DeferredMount>
                </View>
              </>
            ) : (
              <>
                <View style={styles.sectionShell}>
                  <HabitWidget />
                </View>
                <View style={styles.sectionShell}>
                  <MoodDashboard isWidget horizontalInset={0} />
                </View>
                <View style={styles.sectionShell}>
                  <AffirmationsBlock />
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
    borderColor: 'rgba(141, 178, 235, 0.16)',
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.015)',
    overflow: 'hidden',
    ...(globalThis?.window
      ? ({
          boxShadow: '0 10px 22px rgba(10, 15, 26, 0.2)',
        } as object)
      : {}),
  },
  decorGrid: {
    position: 'absolute',
    right: 22,
    bottom: 40,
    width: 88,
    height: 88,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(181, 166, 235, 0.18)',
    backgroundColor: 'rgba(170, 148, 250, 0.04)',
  },
});
