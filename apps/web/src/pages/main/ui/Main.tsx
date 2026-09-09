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
    borderColor: 'rgba(246, 192, 27, 0.14)',
    borderRadius: 18,
    backgroundColor: 'rgba(30, 35, 43, 0.55)',
    overflow: 'hidden',
    ...(globalThis?.window
      ? ({
          boxShadow:
            '0 12px 28px rgba(8, 12, 20, 0.35), inset 0 1px 0 rgba(246, 192, 27, 0.06)',
        } as object)
      : {}),
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
