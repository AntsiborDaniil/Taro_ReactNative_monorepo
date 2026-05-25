import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { SpreadContext } from 'entities/Spread';
import {
  ImageBackground,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CoverFlowCardCarousel } from 'features/carousel';
import { Header } from 'features/header';
import { SpreadName } from 'shared/api';
import { useData } from 'shared/DataProvider';
import { useNativeNavigation } from 'shared/hooks';
import { getCurrentDate, getImage } from 'shared/lib';
import { COLORS } from 'shared/themes';
import { NavigationRoute, TabRoute } from 'shared/types';
import { Button, ScreenLayout, Text, TEXT_TAGS, TEXT_WEIGHT } from 'shared/ui';

const PHONE_MAX_WIDTH = 640;

function DayAdvice() {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const { bottom } = useSafeAreaInsets();
  const isPhone = width < PHONE_MAX_WIDTH;
  const { navigate } = useNativeNavigation();
  const { spread, dayCardHydrated, handleResetDaySuggest } = useData({
    Context: SpreadContext,
  });
  const { handleVibrationClick } = useData({
    Context: ApplicationConfigContext,
  });

  const date = getCurrentDate();
  const hasSelectedDayCard =
    dayCardHydrated &&
    spread?.id === SpreadName.Simple_DaySuggest &&
    !!spread.selectedCards?.length;

  const handleNavigate = () => {
    navigate(TabRoute.MainTab, {
      screen: NavigationRoute.SpreadReadings,
    });
  };

  const handleBackToMain = () => {
    navigate(TabRoute.MainTab, {
      screen: NavigationRoute.Main,
    });
  };

  const handleReset = async () => {
    await handleVibrationClick?.();
    await handleResetDaySuggest?.();
  };

  return (
    <ScreenLayout style={styles.screen}>
      <View style={styles.root}>
        <ImageBackground
          source={getImage(['core', 'girl'])}
          resizeMode="cover"
          style={styles.bg}
          imageStyle={styles.bgImage}
        >
          <View style={styles.scrim} pointerEvents="none" />
          <View style={styles.headerLayer} pointerEvents="box-none">
            <Header
              title={t('spread:daySuggest.name')}
              backAction={handleBackToMain}
            />
          </View>

          <View
            style={[
              styles.center,
              { paddingBottom: bottom + (isPhone ? 12 : 48) },
            ]}
            pointerEvents="box-none"
          >
            {!isPhone && (
              <View style={styles.text}>
                <Text category={TEXT_TAGS.h2} weight={TEXT_WEIGHT.medium}>
                  {date ?? ''}
                </Text>
                <Text category={TEXT_TAGS.h1} weight={TEXT_WEIGHT.medium}>
                  {t('core:dailyCard.title')}
                </Text>
              </View>
            )}
            {hasSelectedDayCard && (
              <Button style={styles.resetButton} onPress={handleReset}>
                {t('core:button.resetDayCard')}
              </Button>
            )}
            <CoverFlowCardCarousel
              hasImmediateAnimation
              onAdditionalClick={handleNavigate}
              overlayControls={isPhone}
            />
          </View>
        </ImageBackground>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingTop: 0,
    paddingHorizontal: 0,
    gap: 0,
  },
  root: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: COLORS.Background,
  },
  bg: {
    flex: 1,
    width: '100%',
    minHeight: 0,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bgImage: {
    opacity: 0.85,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 12, 22, 0.15)',
    zIndex: 0,
  },
  headerLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
  },
  center: {
    flex: 1,
    width: '100%',
    alignSelf: 'stretch',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    zIndex: 1,
  },
  text: {
    width: '100%',
    maxWidth: 320,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(8, 12, 22, 0.42)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    gap: 4,
    ...({
      boxShadow: '0 10px 28px rgba(0, 0, 0, 0.28)',
    } as object),
  },
  resetButton: {
    width: '100%',
    maxWidth: 280,
    backgroundColor: 'rgba(18, 25, 41, 0.92)',
    borderWidth: 1,
    borderColor: COLORS.Primary,
    borderRadius: 12,
    zIndex: 4,
  },
});

export default DayAdvice;
