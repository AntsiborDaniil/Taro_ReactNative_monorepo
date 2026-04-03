import { SafeAreaView, ScrollView, View } from 'react-native';
import { Button, StyleService } from '@ui-kitten/components';
// import { useTranslation } from 'react-i18next';
import { MoodDashboard } from 'features/MoodDashboard';
import { clearAllData } from 'shared/lib';
// import { AnalyticAction } from 'shared/types';
import { ScreenLayout } from 'shared/ui';
import { HabitWidget } from 'widgets/habitWidget';
// import { FAVORITE_SPREADS } from '../lib';
import { AffirmationsBlock } from './AffirmationsBlock';
// import { Categories } from './Categories';
import { DayAdvice } from './DayAdvice';
// import { TarotSpreadsCarousel } from './TarotSpreadsCarousel';

function Main() {
  // const { t } = useTranslation();

  return (
    <ScreenLayout>
      <ScrollView>
        <SafeAreaView style={styles.container}>
          <View style={styles.padding}>
            <DayAdvice />
          </View>
          <HabitWidget />
          <MoodDashboard isWidget />
          <AffirmationsBlock />
          {/*<Categories />*/}
          {/*<TarotSpreadsCarousel*/}
          {/*  analyticAction={AnalyticAction.ClickPopularMainPage}*/}
          {/*  spreads={FAVORITE_SPREADS}*/}
          {/*  title={t('main:popularSpreads')}*/}
          {/*  spaceBetween={22}*/}
          {/*/>*/}
          {/*<Button*/}
          {/*  onPress={() => {*/}
          {/*    clearAllData();*/}
          {/*  }}*/}
          {/*>*/}
          {/*  Очистка памяти*/}
          {/*</Button>*/}
        </SafeAreaView>
      </ScrollView>
    </ScreenLayout>
  );
}

export default Main;

const styles = StyleService.create({
  container: {
    display: 'flex',
    height: 'auto',
    flexDirection: 'column',
    gap: 36,
    marginBottom: 48,
  },
  padding: {
    paddingLeft: 16,
    paddingRight: 16,
  },
});
