import { ReactElement } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { MoodAndEnergyContext } from 'entities/moodAndEnergy';
import { MotivationContext } from 'entities/tarotMotivation';
import { useTranslation } from 'react-i18next';
import { Header } from 'features/header';
import { MoodDashboard } from 'features/MoodDashboard';
import { useData } from 'shared/DataProvider';
import { useNativeNavigation } from 'shared/hooks';
import { MotivationKey } from 'shared/api';
import { NavigationRoute, TabRoute } from 'shared/types';
import { Button, ScreenLayout } from 'shared/ui';
import { InputSlider } from 'shared/ui/Slider/Slider';

import { useMoodAndEnergyLayout } from './useMoodAndEnergyLayout';

export type MoodAndEnergyScreenProps = {};

function MoodAndEnergyScreen(_props: MoodAndEnergyScreenProps): ReactElement {
  const { t } = useTranslation('moodAndEnergy');
  const layout = useMoodAndEnergyLayout();

  const { displayData, updateTodayMood } = useData({
    Context: MoodAndEnergyContext,
  });
  const { todayProgress } = useData({
    Context: MoodAndEnergyContext,
  });
  const { handleSelectMotivationItem } = useData({
    Context: MotivationContext,
  });
  const navigation = useNativeNavigation();

  const handleCreateMoodCard = async () => {
    if (!todayProgress || todayProgress.percents !== 100) {
      return;
    }

    await handleSelectMotivationItem?.({
      key: MotivationKey.MoodAndEnergy,
      parameters: todayProgress.values,
    });

    navigation.navigate(TabRoute.MainTab, {
      screen: NavigationRoute.MotivationCard,
    });
  };

  return (
    <ScreenLayout>
      <Header title={t('core:yourState')} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollInner,
          { paddingBottom: layout.scrollBottomPad },
        ]}
      >
        <View
          style={[
            styles.column,
            {
              width: '100%',
              maxWidth: '100%',
              alignSelf: 'stretch',
              paddingHorizontal: layout.padding,
            },
          ]}
        >
          {!!displayData?.length && (
            <View style={styles.block}>
              <MoodDashboard horizontalInset={0} />
              <View style={styles.sliders}>
                <InputSlider
                  value={displayData[displayData?.length - 1].mood || 0}
                  maxValue={10}
                  minValue={0}
                  onChange={(value: number) =>
                    updateTodayMood?.({ name: 'mood', value })
                  }
                  step={1}
                  color={'#2658B7'}
                  label={t('name.mood')}
                />
                <InputSlider
                  value={displayData[displayData?.length - 1].energy || 0}
                  maxValue={10}
                  minValue={0}
                  onChange={(value: number) =>
                    updateTodayMood?.({ name: 'energy', value })
                  }
                  step={1}
                  color={'#50A622'}
                  label={t('name.energy')}
                />
                <InputSlider
                  value={displayData[displayData?.length - 1].stress || 0}
                  maxValue={10}
                  minValue={0}
                  onChange={(value: number) =>
                    updateTodayMood?.({ name: 'stress', value })
                  }
                  step={1}
                  color={'#AC2224'}
                  label={t('name.stress')}
                />
              </View>
            </View>
          )}
          <Button
            style={styles.createCardButton}
            disabled={todayProgress?.percents !== 100}
            onPress={handleCreateMoodCard}
          >
            {t('progress.createCard')}
          </Button>
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scrollInner: {
    flexGrow: 1,
    width: '100%',
    alignSelf: 'stretch',
    paddingTop: 8,
  },
  column: {
    width: '100%',
    gap: 20,
  },
  block: {
    gap: 8,
  },
  sliders: {
    paddingTop: 8,
    paddingBottom: 4,
  },
  createCardButton: {
    marginTop: 4,
  },
});

export default MoodAndEnergyScreen;
