import { StyleSheet, TouchableOpacity, View } from 'react-native';
import AppMetrica from '@appmetrica/react-native-analytics';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { SpreadContext } from 'entities/Spread';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import Video from 'react-native-video';
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
    <View style={styles.container}>
      <Video
        style={styles.video}
        muted={true} // Отключить звук, если видео используется как фон
        repeat={true} // Зациклить воспроизведение
        resizeMode="cover" // Аналогично ImageBackground, растягивает видео
        rate={1.0} // Скорость воспроизведения
        ignoreSilentSwitch="obey"
        source={getImage(['videos', 'girl'])}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleSelectDayAdvice}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={[
            'rgba(0, 0, 0, 0)',
            'rgba(0, 0, 0, 0)',
            'rgba(0, 0, 0, 0)',
            'rgba(0, 0, 0, 0)',
            'rgba(0, 0, 0, 0)',
            'rgba(0, 0, 0, 0)',
            'rgba(24, 24, 24, 0.334474)',
            'rgba(30, 30, 30, 0.41)',
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: isTablet ? verticalScale(600) : verticalScale(410),
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  button: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  wrapper: {
    marginTop: 'auto',
    alignItems: 'center',
    paddingBottom: 29,
  },
  video: {
    width: '100%',
    height: '100%',
  },
});

export default DayAdvice;
