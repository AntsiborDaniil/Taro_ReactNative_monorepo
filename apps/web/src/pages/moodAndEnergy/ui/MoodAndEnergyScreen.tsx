import { ReactElement } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { MoodAndEnergyContext } from 'entities/moodAndEnergy';
import { UserContext } from 'entities/user';
import { useTranslation } from 'react-i18next';
import { Header } from 'features/header';
import { MoodDashboard } from 'features/MoodDashboard';
import { useData } from 'shared/DataProvider';
import { shouldPromptWebSignIn } from 'shared/lib';
import { COLORS } from 'shared/themes';
import { NavigationRoute, TabRoute } from 'shared/types';
import { Button, ScreenLayout, Text, TEXT_TAGS } from 'shared/ui';
import { InputSlider } from 'shared/ui/Slider/Slider';

import { useMoodAndEnergyLayout } from './useMoodAndEnergyLayout';

export type MoodAndEnergyScreenProps = {};

function MoodAndEnergyScreen(_props: MoodAndEnergyScreenProps): ReactElement {
  const { t } = useTranslation('moodAndEnergy');
  const layout = useMoodAndEnergyLayout();
  const navigation = useNativeNavigation();

  const { isAuthenticated, authSessionLoading } = useData({
    Context: UserContext,
  });

  const { displayData, updateTodayMood } = useData({
    Context: MoodAndEnergyContext,
  });

  if (shouldPromptWebSignIn(isAuthenticated, authSessionLoading)) {
    return (
      <ScreenLayout>
        <Header title={t('core:yourState')} />
        <View style={styles.authGate}>
          <Text category={TEXT_TAGS.p1} style={styles.authGateText}>
            {t('signInRequired.body')}
          </Text>
          <Button
            style={styles.authGateButton}
            onPress={() =>
              navigation.navigate(TabRoute.LibraryTab, {
                screen: NavigationRoute.Auth,
              })
            }
          >
            {t('signInRequired.cta')}
          </Button>
        </View>
      </ScreenLayout>
    );
  }

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
  authGate: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    gap: 20,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 420,
    alignSelf: 'center',
  },
  authGateText: {
    textAlign: 'center',
    color: COLORS.SpbSky1,
    lineHeight: 22,
  },
  authGateButton: {
    minWidth: 220,
  },
});

export default MoodAndEnergyScreen;
