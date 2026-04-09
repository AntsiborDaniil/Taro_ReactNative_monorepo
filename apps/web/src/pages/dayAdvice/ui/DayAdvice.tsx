import { Image, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CoverFlowCardCarousel } from 'features/carousel';
import { Header } from 'features/header';
import { useNativeNavigation } from 'shared/hooks';
import { getCurrentDate, getImage } from 'shared/lib';
import { NavigationRoute, TabRoute } from 'shared/types';
import { ScreenLayout, Text, TEXT_TAGS, TEXT_WEIGHT } from 'shared/ui';

function DayAdvice() {
  const { t } = useTranslation();
  const { bottom } = useSafeAreaInsets();
  const { navigate } = useNativeNavigation();

  const date = getCurrentDate();

  const handleNavigate = () => {
    navigate(TabRoute.MainTab, {
      screen: NavigationRoute.SpreadReadings,
    });
  };

  return (
    <ScreenLayout>
      <Header title="" />
      <Image style={styles.image} source={getImage(['core', 'girl'])} />
      <View style={[styles.advice, { bottom: bottom + 48 }]}>
        <View style={styles.text}>
          <Text category={TEXT_TAGS.h2} weight={TEXT_WEIGHT.medium}>
            {date ?? ''}
          </Text>
          <Text category={TEXT_TAGS.h1} weight={TEXT_WEIGHT.medium}>
            {t('core:dailyCard.title')}
          </Text>
        </View>
        <CoverFlowCardCarousel
          hasImmediateAnimation
          onAdditionalClick={handleNavigate}
        />
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  advice: {
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  text: {
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    gap: 8,
  },
  image: {
    width: '100%',
    height: '80%',
    padding: 16,
    borderRadius: 16,
    opacity: 0.7,
  },
});

export default DayAdvice;
