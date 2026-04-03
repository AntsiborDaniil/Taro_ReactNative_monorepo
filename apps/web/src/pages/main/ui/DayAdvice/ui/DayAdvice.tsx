import { ImageBackground, StyleSheet, TouchableOpacity, View } from 'react-native';
import AppMetrica from '@appmetrica/react-native-analytics';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { SpreadContext } from 'entities/Spread';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { simpleSpreads } from 'shared/api';
import { useData } from 'shared/DataProvider';
import { useNativeNavigation } from 'shared/hooks';
import { getCurrentDate, getImage, isTablet, verticalScale } from 'shared/lib';
import { AnalyticAction, NavigationRoute, TabRoute } from 'shared/types';
import { Text, TEXT_TAGS, TEXT_WEIGHT } from 'shared/ui';

function DayAdvice() {
  const { navigate } = useNativeNavigation();

  const { t } = useTranslation();
  const date = getCurrentDate();

  const { selectSpread } = useData({
    Context: SpreadContext,
  });

  const { handleVibrationClick } = useData({
    Context: ApplicationConfigContext,
  });

  const handleSelectDayAdvice = async () => {
    AppMetrica.reportEvent(AnalyticAction.ClickDayCard);

    await handleVibrationClick?.();

    const { shouldRedirectToSpreadReading } =
      (await selectSpread?.(simpleSpreads.daySuggest)) || {};

    if (shouldRedirectToSpreadReading) {
      navigate(TabRoute.MainTab, {
        screen: NavigationRoute.SpreadReadings,
      });

      return;
    }

    navigate(TabRoute.MainTab, {
      screen: NavigationRoute.DayAdvice,
    });
  };

  return (
    <ImageBackground
      source={getImage(['core', 'girl'])}
      resizeMode="cover"
      style={styles.container}
    >
      <TouchableOpacity
        style={styles.button}
        onPress={handleSelectDayAdvice}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={[
            'rgba(0,0,0,0)',
            'rgba(0,0,0,0)',
            'rgba(0,0,0,0)',
            'rgba(24,24,24,0.33)',
            'rgba(30,30,30,0.7)',
            '#1E1E1E',
          ]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.wrapper}>
          <Text category={TEXT_TAGS.h3} weight={TEXT_WEIGHT.medium}>
            {date ?? ''}
          </Text>
          <Text category={TEXT_TAGS.h1} weight={TEXT_WEIGHT.medium}>
            {t('core:dailyCard.title')}
          </Text>
        </View>
      </TouchableOpacity>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: verticalScale(isTablet ? 600 : 410),
    maxHeight: 460,
    borderRadius: 16,
    overflow: 'hidden',
  },
  button: {
    width: '100%',
    height: '100%',
  },
  wrapper: {
    marginTop: 'auto',
    alignItems: 'center',
    paddingBottom: 29,
  },
});

export default DayAdvice;
