import { ImageBackground, Platform, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  AnimationCarouselContext,
  CoverFlowCardCarousel,
  useAnimationCarousel,
} from 'features/carousel';
import { Header } from 'features/header';
import { DataProvider } from 'shared/DataProvider';
import { useNativeNavigation } from 'shared/hooks';
import { getCurrentDate, getImage } from 'shared/lib';
import { NavigationRoute, TabRoute } from 'shared/types';
import { ScreenLayout, Text, TEXT_TAGS, TEXT_WEIGHT } from 'shared/ui';

function DayAdvice() {
  const { t } = useTranslation();
  const { navigate } = useNativeNavigation();

  // AnimationCarouselContext must be provided here so SlideItem can
  // access handleAnimate / flip / etc. when a card is tapped
  const animationCarouselContextData = useAnimationCarousel();

  const date = getCurrentDate();

  const handleNavigate = () => {
    navigate(TabRoute.MainTab, {
      screen: NavigationRoute.SpreadReadings,
    });
  };

  return (
    <ScreenLayout style={styles.screen}>
      <Header title="" />
      {/* Background image fills the space behind the carousel */}
      <ImageBackground
        source={getImage(['core', 'girl'])}
        resizeMode="cover"
        style={styles.background}
      >
        <View style={styles.overlay} />
        <View style={styles.content}>
          <View style={styles.text}>
            <Text category={TEXT_TAGS.h2} weight={TEXT_WEIGHT.medium}>
              {date ?? ''}
            </Text>
            <Text category={TEXT_TAGS.h1} weight={TEXT_WEIGHT.medium}>
              {t('core:dailyCard.title')}
            </Text>
          </View>
          <DataProvider
            Context={AnimationCarouselContext}
            value={animationCarouselContextData}
          >
            <CoverFlowCardCarousel
              hasImmediateAnimation
              onAdditionalClick={handleNavigate}
            />
          </DataProvider>
        </View>
      </ImageBackground>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: 0,
    gap: 0,
  },
  background: {
    flex: 1,
    // On web we need explicit overflow to clip the carousel that uses screen.width
    ...(Platform.OS === 'web' ? { overflow: 'hidden' } as any : {}),
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,15,24,0.45)',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 48,
    gap: 16,
  },
  text: {
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    gap: 8,
  },
});

export default DayAdvice;
