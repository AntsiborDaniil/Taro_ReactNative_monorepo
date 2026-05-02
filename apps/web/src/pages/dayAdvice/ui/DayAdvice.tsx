import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { SpreadContext } from 'entities/Spread';
import { Image, StyleSheet, View } from 'react-native';
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

function DayAdvice() {
  const { t } = useTranslation();
  const { bottom } = useSafeAreaInsets();
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
    <ScreenLayout>
      <View style={styles.root}>
        <Image style={styles.image} source={getImage(['core', 'girl'])} />
        <View
          style={[styles.advice, { paddingBottom: bottom + 48 }]}
          pointerEvents="box-none"
        >
          <View style={styles.text}>
            <Text category={TEXT_TAGS.h2} weight={TEXT_WEIGHT.medium}>
              {date ?? ''}
            </Text>
            <Text category={TEXT_TAGS.h1} weight={TEXT_WEIGHT.medium}>
              {t('core:dailyCard.title')}
            </Text>
          </View>
          {hasSelectedDayCard && (
            <Button style={styles.resetButton} onPress={handleReset}>
              {t('core:button.resetDayCard')}
            </Button>
          )}
          <CoverFlowCardCarousel
            hasImmediateAnimation
            onAdditionalClick={handleNavigate}
          />
        </View>
        <View style={styles.headerLayer} pointerEvents="box-none">
          <Header title="" backAction={handleBackToMain} />
        </View>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    minHeight: 0,
    position: 'relative',
    width: '100%',
  },
  headerLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    elevation: 50,
  },
  advice: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    opacity: 0.7,
    zIndex: 0,
  },
});

export default DayAdvice;
