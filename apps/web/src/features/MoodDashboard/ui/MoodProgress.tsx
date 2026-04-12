import { Platform, Pressable, StyleSheet, View } from 'react-native';
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
      style={({ pressed, hovered }) => [
        styles.wrapper,
        !isWidget && styles.wrapperScreen,
        isWidget && styles.wrapperWidget,
        hovered && !isWidget && Platform.OS === 'web' && styles.wrapperScreenHover,
        pressed && styles.wrapperPressed,
      ]}
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
      <CircularProgressBar
        size={isWidget ? 'medium' : 'large'}
        style={styles.progress}
        textStyle={[
          styles.progressPercentLabel,
          !isWidget && styles.progressPercentLabelScreen,
        ]}
        progress={(todayProgress?.percents ?? 0) / 100}
      />
      <View
        style={[
          styles.texts,
          isWidget && styles.textsWidget,
          !isWidget && styles.textsScreen,
        ]}
      >
        <Text
          category={TEXT_TAGS.h4}
          style={[
            styles.mainText,
            isWidget && styles.mainTextWidget,
            !isWidget && styles.mainTextScreen,
          ]}
        >
          {todayProgress?.percents === 100
            ? t('progress.howAreYou')
            : t('progress.assess')}
        </Text>
        {todayProgress?.percents !== 100 && (
          <Text
            category={TEXT_TAGS.label}
            style={[
              styles.subText,
              isWidget && styles.subTextWidget,
              !isWidget && styles.subTextScreen,
            ]}
          >
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
    gap: 22,
    marginHorizontal: 16,
    marginVertical: 14,
  },
  wrapperScreen: {
    width: '100%',
    maxWidth: '100%',
    alignSelf: 'stretch',
    marginHorizontal: 0,
    marginVertical: 16,
    paddingHorizontal: 28,
    paddingVertical: 24,
    gap: 28,
    borderRadius: 16,
    borderColor: 'rgba(132, 176, 230, 0.45)',
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 8px 28px rgba(0, 0, 0, 0.22)',
        } as object)
      : {}),
  },
  wrapperScreenHover:
    Platform.OS === 'web'
      ? ({
          borderColor: 'rgba(160, 198, 255, 0.65)',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.3)',
          backgroundColor: 'rgba(26, 34, 48, 0.98)',
        } as object)
      : {},
  wrapperPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }],
  },
  wrapperWidget: {
    width: '100%',
    maxWidth: '100%',
    alignSelf: 'stretch',
    marginHorizontal: 0,
    marginTop: 4,
    marginBottom: 2,
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 20,
  },
  progress: {
    flexShrink: 0,
  },
  progressPercentLabel: {
    paddingHorizontal: 8,
    textAlign: 'center',
  },
  progressPercentLabelScreen: {
    paddingHorizontal: 12,
    fontSize: 22,
  },
  texts: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  textsWidget: {
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 2,
  },
  textsScreen: {
    gap: 10,
    justifyContent: 'center',
  },
  mainText: {
    lineHeight: 22,
  },
  mainTextWidget: {
    lineHeight: 22,
  },
  mainTextScreen: {
    fontSize: 22,
    lineHeight: 22,
    letterSpacing: 0.15,
  },
  subText: {
    color: COLORS.SpbSky1,
    lineHeight: 22,
  },
  subTextWidget: {
    lineHeight: 22,
    marginTop: 2,
  },
  subTextScreen: {
    fontSize: 22,
    lineHeight: 22,
    marginTop: 4,
  },
});

export default MoodProgress;
