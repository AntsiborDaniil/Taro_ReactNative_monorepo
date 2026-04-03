import { ReactElement } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { MoodAndEnergyContext } from 'entities/moodAndEnergy';
import { useTranslation } from 'react-i18next';
import { Header } from 'features/header';
import { MoodDashboard, MoodProgress } from 'features/MoodDashboard';
import { useData } from 'shared/DataProvider';
import { ScreenLayout } from 'shared/ui';
import { InputSlider } from 'shared/ui/Slider/Slider';

export type MoodAndEnergyScreenProps = {};

function MoodAndEnergyScreen(props: MoodAndEnergyScreenProps): ReactElement {
  const { t } = useTranslation('moodAndEnergy');

  const { displayData, updateTodayMood } = useData({
    Context: MoodAndEnergyContext,
  });

  return (
    <ScreenLayout>
      <Header title={t('core:yourState')} />
      <ScrollView>
        {!!displayData?.length && (
          <View>
            <MoodDashboard />
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
        <MoodProgress />
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  sliders: {
    padding: 16,
  },
});

export default MoodAndEnergyScreen;
