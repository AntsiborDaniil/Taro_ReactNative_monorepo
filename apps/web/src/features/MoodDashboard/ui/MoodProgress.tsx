import { Pressable, StyleSheet, View } from 'react-native';
import { CircularProgressBar } from '@ui-kitten/components';
import { MoodAndEnergyContext } from 'entities/moodAndEnergy';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useData } from 'shared/DataProvider';
import { useNativeNavigation } from 'shared/hooks';
import { COLORS } from 'shared/themes';
import { NavigationRoute, TabRoute } from 'shared/types';
import { Text, TEXT_TAGS } from 'shared/ui';
import { MotivationContext } from '../../../entities/tarotMotivation';
import { MotivationKey } from '../../../shared/api';

export type MoodProgressProps = {
  isWidget?: boolean;
};

function MoodProgress({ isWidget }: MoodProgressProps): ReactElement {
  const { todayProgress } = useData({
    Context: MoodAndEnergyContext,
  });

  const navigation = useNativeNavigation();

  const { handleSelectMotivationItem } = useData({
    Context: MotivationContext,
  });

  const { t } = useTranslation('moodAndEnergy');

  return (
    <Pressable
      style={styles.wrapper}
      onPress={async () => {
        if (isWidget) {
          navigation.navigate(TabRoute.MainTab, {
            screen: NavigationRoute.MoodAndEnergy,
          });

          return;
        }

        if (todayProgress) {
          await handleSelectMotivationItem?.({
            key: MotivationKey.MoodAndEnergy,
            parameters: todayProgress?.values,
          });

          navigation.navigate(TabRoute.MainTab, {
            screen: NavigationRoute.MotivationCard,
          });
        }
      }}
    >
      <CircularProgressBar style={styles.progress} progress={(todayProgress?.percents ?? 0) / 100} />
      <View style={styles.texts}>
        <Text category={TEXT_TAGS.h4} style={styles.mainText}>
          {todayProgress?.percents === 100
            ? t('progress.howAreYou')
            : t('progress.assess')}
        </Text>
        {todayProgress?.percents !== 100 && (
          <Text category={TEXT_TAGS.label} style={styles.subText}>
            {`${t('progress')} ${todayProgress?.filledValuesCount}/${todayProgress?.allValuesCount}`}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 22,
    paddingVertical: 20,
    alignItems: 'center',
    borderRadius: 12,
    borderColor: COLORS.Secondary,
    borderWidth: 1,
    backgroundColor: COLORS.Background2,
    flexDirection: 'row',
    gap: 20,
    marginHorizontal: 16,
    marginVertical: 14,
  },
  progress: {
    width: 42,
    height: 42,
  },
  texts: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  mainText: {
    lineHeight: 30,
  },
  subText: {
    color: COLORS.SpbSky1,
  },
});

export default MoodProgress;
