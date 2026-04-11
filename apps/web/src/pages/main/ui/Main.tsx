import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { MoodDashboard } from 'features/MoodDashboard';
import { ScreenLayout } from 'shared/ui';
import { HabitWidget } from 'widgets/habitWidget';
import { AffirmationsBlock } from './AffirmationsBlock';
import { DayAdvice } from './DayAdvice';
import { useMainLayout } from './useMainLayout';

function Main() {
  const layout = useMainLayout();

  return (
    <ScreenLayout>
      <ScrollView
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
              {
                maxWidth: layout.contentWidth,
                paddingHorizontal: layout.padding,
                gap: layout.sectionGap,
              },
            ]}
          >
            <DayAdvice />
            <HabitWidget />
            <MoodDashboard isWidget horizontalInset={0} />
            <AffirmationsBlock />
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
});
