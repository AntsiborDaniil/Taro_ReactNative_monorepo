import {
  ImageBackground,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import AppMetrica from '@appmetrica/react-native-analytics';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { SpreadContext } from 'entities/Spread';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { simpleSpreads } from 'shared/api';
import { useData } from 'shared/DataProvider';
import { useNativeNavigation } from 'shared/hooks';
import {
  getCurrentDate,
  getImage,
  isTablet,
  moderateScale,
  verticalScale,
} from 'shared/lib';
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
      <ImageBackground
        style={styles.video}
        resizeMode="cover"
        source={getImage(['core', 'girlCard'])}
      />
      <Pressable
        style={styles.button}
        onPress={handleSelectDayAdvice}
        accessibilityRole="button"
        accessibilityLabel={t('core:dailyCard.title')}
      >
        <LinearGradient
          pointerEvents="none"
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
          style={styles.gradient}
        />
        <View style={styles.wrapper}>
          <Text
            category={TEXT_TAGS.h3}
            weight={TEXT_WEIGHT.medium}
            style={styles.date}
          >
            {date ?? ''}
          </Text>
          <Text
            category={TEXT_TAGS.h1}
            weight={TEXT_WEIGHT.medium}
            style={styles.title}
          >
            {t('core:dailyCard.title')}
          </Text>
        </View>
      </Pressable>
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
    overflow: 'visible',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  wrapper: {
    marginTop: 'auto',
    alignSelf: 'stretch',
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    gap: 10,
    zIndex: 1,
    position: 'relative',
    overflow: 'visible',
  },
  date: {
    textAlign: 'center',
    lineHeight: moderateScale(26),
    paddingVertical: 4,
  },
  title: {
    textAlign: 'center',
    // запас выше кегля: иначе на web ascenders обрезаются родителем с overflow:hidden
    lineHeight: moderateScale(42),
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 4,
    minHeight: moderateScale(48),
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : null),
    ...Platform.select({
      web: { overflow: 'visible' },
      default: {},
    }),
  },
  video: {
    width: '100%',
    height: '100%',
  },
});

export default DayAdvice;
