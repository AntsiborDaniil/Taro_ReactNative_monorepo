import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Carousel, {
  ICarouselInstance,
  Pagination,
} from 'react-native-reanimated-carousel';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useData } from 'shared/DataProvider';
import { CrossIcon } from 'shared/icons';
import { AsyncMemoryKey, getImage, isTablet } from 'shared/lib';
import { COLORS } from 'shared/themes';
import { Button, Text, TEXT_TAGS } from 'shared/ui';
import { ModalsContext } from 'shared/ui/ModalsProvider';
import { PaymentContext } from '../../payment';

type THelloScreenItem = {
  title: string;
  description: string;
  imgSrc?: string[];
};

const HELLO_SCREENS: THelloScreenItem[] = [
  {
    title: 'welcome.title',
    description: 'welcome.description',
    imgSrc: ['helloScreen', 'welcome'],
  },
  {
    title: 'cardOfDay.title',
    description: 'cardOfDay.description',
    imgSrc: ['helloScreen', 'day'],
  },
  {
    title: 'themedSpreads.title',
    description: 'themedSpreads.description',
    imgSrc: ['helloScreen', 'thematics'],
  },
  {
    title: 'cardMeanings.title',
    description: 'cardMeanings.description',
    imgSrc: ['helloScreen', 'book'],
  },
  {
    title: 'cardDesigns.title',
    description: 'cardDesigns.description',
    imgSrc: ['helloScreen', 'cardsDesign'],
  },
  {
    title: 'unlockPractice.title',
    description: 'unlockPractice.description',
    imgSrc: ['helloScreen', 'paidContent'],
  },
];

const screen = Dimensions.get('screen');

function HelloScreen() {
  const carouselRef = useRef<ICarouselInstance>(null);

  const [isButtonVisible, setIsButtonVisible] = useState<boolean>(false);
  const [isLastScreen, setIsLastScreen] = useState<boolean>(false);

  const { t } = useTranslation('hello');

  const { isLoading, handlePurchase, offerings } = useData({
    Context: PaymentContext,
  });

  const { closeModal } = useData({ Context: ModalsContext });

  const insets = useSafeAreaInsets();

  const progress = useSharedValue<number>(0);
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  const handleProgressChange = (_: number, progressValue: number) => {
    progress.value = progressValue;
    // Проверяем, находится ли пользователь на последнем слайде
    if (Math.round(progressValue) === HELLO_SCREENS.length - 1) {
      setIsLastScreen(true);
    }
  };

  const viewNextCard = () => {
    carouselRef.current?.next();
  };

  const priceString = offerings?.current?.availablePackages?.find(
    (item) => item.identifier === '$rc_annual'
  )?.product.priceString;

  const clickContinue = (index: number) => async () => {
    if (index === HELLO_SCREENS.length - 1) {
      await AsyncStorage.setItem(AsyncMemoryKey.ViewedHelloScreen, '1');

      await handlePurchase?.('$rc_annual');
    } else {
      viewNextCard();
    }
  };

  useEffect(() => {
    if (!isLastScreen) {
      return;
    }

    const timer = setTimeout(() => {
      setIsButtonVisible(true);
    }, 2000); // Задержка 2 секунды

    return () => clearTimeout(timer); // Очистка таймера при размонтировании
  }, [isLastScreen]);

  useEffect(() => {
    if (!isButtonVisible) {
      return;
    }

    // Запускаем анимацию с задержкой 2 секунды
    opacity.value = withDelay(
      1000, // Задержка в миллисекундах
      withTiming(1, { duration: 1000 }) // Плавное появление за 1 секунду
    );
  }, [opacity, isButtonVisible]);

  return (
    <SafeAreaView style={styles.modalOverlayWrapper}>
      <Carousel
        ref={carouselRef}
        data={HELLO_SCREENS}
        onProgressChange={handleProgressChange}
        enabled={false}
        loop={false}
        width={screen.width}
        renderItem={({ item, index }) => {
          return (
            <View style={styles.screenItem}>
              <Animated.View style={[styles.buttonContainer, animatedStyle]}>
                <TouchableOpacity
                  style={styles.close}
                  onPress={async () => {
                    await AsyncStorage.setItem(
                      AsyncMemoryKey.ViewedHelloScreen,
                      '1'
                    );
                    closeModal?.();
                  }}
                  activeOpacity={0.7}
                >
                  <CrossIcon
                    opacity={index === HELLO_SCREENS.length - 1 ? 1 : 0}
                    width={isTablet ? 32 : 24}
                    height={isTablet ? 32 : 24}
                  />
                </TouchableOpacity>
              </Animated.View>
              <Image
                style={styles.image}
                resizeMode={'contain'}
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                source={getImage(item.imgSrc ?? [])}
              />
              <View style={styles.textsContainer}>
                <Text style={styles.titleText} category={TEXT_TAGS.h2}>
                  {t(item.title)}
                </Text>
                <Text style={styles.descriptionText}>
                  {t(item.description, {
                    price: priceString,
                  })}
                </Text>
              </View>
              <Pagination.Basic
                progress={progress}
                data={HELLO_SCREENS}
                dotStyle={{
                  height: 8,
                  width: 8,
                  borderRadius: 6,
                  backgroundColor: COLORS.SpbSky3,
                }}
                activeDotStyle={{
                  overflow: 'hidden',
                  borderRadius: 6,
                  backgroundColor: COLORS.Primary,
                }}
                containerStyle={{
                  gap: 8,
                  paddingHorizontal: 16,
                  paddingBottom: 16,
                }}
                horizontal
                // onPress={onPressPagination}
              />

              {isLoading ? (
                <ActivityIndicator
                  style={{
                    top:
                      (Dimensions.get('window').height -
                        insets.top -
                        insets.bottom) /
                        2 -
                      18,
                  }}
                  size="large"
                  color={COLORS.Primary}
                />
              ) : (
                <Button onPress={clickContinue(index)} style={styles.button}>
                  {t('core:continue')}
                </Button>
              )}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  modalOverlayWrapper: {
    backgroundColor: COLORS.Background,
  },
  screenItem: {
    padding: 16,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    position: 'relative',
    height: '100%',
  },
  buttonContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
  },
  close: {},
  textsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  descriptionText: {
    textAlign: 'center',
  },
  titleText: { textAlign: 'center' },
  button: {
    marginTop: 16,
    width: '100%',
  },
  image: {
    width: '100%',
    maxHeight: '50%',
    padding: 16,
    borderRadius: 16,
  },
});

export default HelloScreen;
