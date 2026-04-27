import {
  ImageBackground,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
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
import { COLORS } from 'shared/themes';
import { AnalyticAction, NavigationRoute, TabRoute } from 'shared/types';
import { Text, TEXT_TAGS, TEXT_WEIGHT } from 'shared/ui';

function DayAdvice() {
  const { navigate } = useNativeNavigation();
  const { width: winW } = useWindowDimensions();
  const isCompact = winW < 420;

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
      <Pressable
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
        ]}
        onPress={handleSelectDayAdvice}
        accessibilityRole="button"
        accessibilityLabel={t('core:dailyCard.title')}
      >
        <LinearGradient
          colors={[
            'rgba(16, 24, 38, 0.96)',
            'rgba(18, 26, 42, 0.96)',
          ]}
          style={styles.gradient}
        />
        <View style={[styles.decorOrb, styles.decorOrbTop]} />
        <View style={[styles.decorOrb, styles.decorOrbBottom]} />

        <View style={[styles.heroStage, isCompact && styles.heroStageCompact]}>
          <View style={[styles.heroRail, styles.heroRailLeft]} />
          <View style={[styles.heroRail, styles.heroRailRight]} />
          <View style={[styles.heroFrame, isCompact && styles.heroFrameCompact]}>
            <ImageBackground
              style={styles.heroImage}
              imageStyle={styles.heroImageSource}
              resizeMode="cover"
              source={getImage(['core', 'girlCard'])}
            >
              <LinearGradient
                colors={['rgba(0, 0, 0, 0)', 'rgba(13, 18, 30, 0.88)']}
                style={styles.heroImageFade}
              />
              <View style={styles.heroOverlayBadge}>
                <Text category={TEXT_TAGS.p2} style={styles.dateInImage}>
                  {date ?? ''}
                </Text>
                <Text
                  category={TEXT_TAGS.h4}
                  weight={TEXT_WEIGHT.medium}
                  style={styles.titleInImage}
                >
                  {t('core:dailyCard.title')}
                </Text>
              </View>
            </ImageBackground>
          </View>
        </View>

        <View style={styles.wrapper}>
          <Text
            category={TEXT_TAGS.h2}
            weight={TEXT_WEIGHT.medium}
            style={styles.title}
          >
            {t('core:dailyCard.title')}
          </Text>
          <Text
            category={TEXT_TAGS.p2}
            style={styles.subtitle}
          >
            {t('core:spreads.catalog.hint')}
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
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  buttonPressed: {
    opacity: 0.96,
    transform: [{ scale: 0.997 }],
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -2,
  },
  wrapper: {
    marginTop: 8,
    alignSelf: 'stretch',
    width: '100%',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 18,
    gap: 6,
    zIndex: 1,
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    color: COLORS.Content,
  },
  subtitle: {
    textAlign: 'center',
    color: 'rgba(216, 228, 247, 0.75)',
    lineHeight: 22,
  },
  heroStage: {
    marginTop: 18,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 268,
    position: 'relative',
  },
  heroStageCompact: {
    minHeight: 244,
  },
  heroRail: {
    position: 'absolute',
    width: 24,
    height: 232,
    borderRadius: 10,
    backgroundColor: 'rgba(236, 189, 65, 0.95)',
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0 10px 22px rgba(219, 174, 43, 0.3)' } as object)
      : {}),
    zIndex: 1,
  },
  heroRailLeft: {
    left: '27%',
  },
  heroRailRight: {
    right: '27%',
  },
  heroFrame: {
    width: '54%',
    minWidth: 200,
    maxWidth: 280,
    aspectRatio: 0.62,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0 16px 32px rgba(0, 0, 0, 0.28)' } as object)
      : {}),
    zIndex: 2,
  },
  heroFrameCompact: {
    width: '58%',
    minWidth: 184,
  },
  heroImage: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  heroImageSource: {
    width: '100%',
    height: '100%',
    ...Platform.select({
      web: {
        objectFit: 'cover',
        objectPosition: 'center center',
        transform: 'scale(1.18)',
      },
      default: {},
    }),
  },
  heroImageFade: {
    ...StyleSheet.absoluteFillObject,
  },
  heroImageText: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 14,
    paddingHorizontal: 10,
    gap: 4,
  },
  heroOverlayBadge: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 100,
    zIndex: 4,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(8, 12, 22, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(232, 238, 255, 0.36)',
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 6px 16px rgba(0, 0, 0, 0.22)',
        } as object)
      : {}),
  },
  dateInImage: {
    color: '#F2F6FF',
    textAlign: 'center',
    lineHeight: moderateScale(22),
    fontWeight: '600',
  },
  titleInImage: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: 0.15,
  },
  decorOrb: {
    position: 'absolute',
    borderRadius: 999,
    zIndex: -1,
  },
  decorOrbTop: {
    width: 150,
    height: 150,
    top: -76,
    right: -52,
    backgroundColor: 'rgba(119, 95, 230, 0.22)',
  },
  decorOrbBottom: {
    width: 120,
    height: 120,
    bottom: 24,
    left: -46,
    backgroundColor: 'rgba(61, 118, 214, 0.2)',
  },
});

export default DayAdvice;
