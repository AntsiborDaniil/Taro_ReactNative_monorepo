import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { CircularProgressBar } from '@ui-kitten/components';
import { MoodAndEnergyContext } from 'entities/moodAndEnergy';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useData } from 'shared/DataProvider';
import { useNativeNavigation } from 'shared/hooks';
import { COLORS } from 'shared/themes';
import { NavigationRoute, TabRoute } from 'shared/types';
import { Text } from 'shared/ui';
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
    <TouchableOpacity
      activeOpacity={1}
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
      <CircularProgressBar progress={(todayProgress?.percents ?? 0) / 100} />
      <View style={styles.texts}>
        <Text>
          {todayProgress?.percents === 100
            ? t('progress.howAreYou')
            : t('progress.assess')}
        </Text>
        {todayProgress?.percents !== 100 && (
          <Text>{`${t('progress')} ${todayProgress?.filledValuesCount}/${todayProgress?.allValuesCount}`}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    padding: 16,
    alignItems: 'center',
    borderRadius: 12,
    borderColor: COLORS.Secondary,
    borderWidth: 1,
    backgroundColor: COLORS.Background2,
    flexDirection: 'row',
    gap: 16,
    marginHorizontal: 16,
    marginVertical: 16,
  },
  texts: {
    width: 200,
  },
});

export default MoodProgress;
