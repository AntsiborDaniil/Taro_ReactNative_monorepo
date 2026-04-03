import { useRef } from 'react';
import { Platform } from 'react-native';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { SpreadContext } from 'entities/Spread';
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { ANIMATED_CARD_TIMEOUT, SLIDER_CARD_SIZE } from 'shared/constants';
import { useData } from 'shared/DataProvider';
import { useRotateAnimation } from 'shared/hooks';
import { TAnimationCarouselHookResult } from './types';

export function useAnimationCarousel(): TAnimationCarouselHookResult {
  const { handleVibrationClick } = useData({
    Context: ApplicationConfigContext,
  });

  const prevPositionRef = useRef({
    x: 0,
    y: 0,
  });

  // Начальные координаты карточки
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(0.85);
  const opacity = useSharedValue(0);

  const { spread } = useData({ Context: SpreadContext });

  const rotateAnimation = useRotateAnimation({ duration: 700 });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
        { rotate: `${rotate.value}deg` },
      ],
      opacity: opacity.value,
    };
  });

  const handleGetCenterCardPosition = (x: number, y: number) => {
    prevPositionRef.current = { x, y: y - SLIDER_CARD_SIZE.height };

    translateX.value = x;
    translateY.value = y - SLIDER_CARD_SIZE.height;
  };

  const handleAnimate = (index?: number) => {
    if (!spread?.cardsPosition[spread?.selectedCards?.length]) {
      return;
    }

    const isHorizontalCard =
      typeof index === 'number' && spread?.horizontalPosition?.includes(index);

    // специально для кельтского креста (не универсально), если нужно
    // будет еще горизонт карточки надо подумать как с координатами работать
    const positionIndex = isHorizontalCard ? 1 : spread?.selectedCards.length;

    const { x, y } = spread.cardsPosition[positionIndex];

    opacity.value = 1;

    // Последовательность анимаций

    if (isHorizontalCard) {
      rotate.value = withDelay(
        ANIMATED_CARD_TIMEOUT / 2,
        withTiming(90, {
          duration: ANIMATED_CARD_TIMEOUT / 2,
          easing: Easing.inOut(Easing.ease),
        })
      );
    }

    translateX.value = withSequence(
      // Первая фаза
      withTiming(x ?? 0, {
        duration: ANIMATED_CARD_TIMEOUT / 2,
        easing: Easing.out(Easing.ease),
      }),
      // Вторая фаза
      withTiming(x ?? 0, {
        duration: ANIMATED_CARD_TIMEOUT / 2,
        easing: Easing.inOut(Easing.ease),
      })
    );

    const deltaYPlatform =
      Platform.OS === 'android' ? SLIDER_CARD_SIZE.height / 2 : 0;

    translateY.value = withSequence(
      withTiming((y ?? 0) - SLIDER_CARD_SIZE.height / 2 - 3 + deltaYPlatform, {
        duration: ANIMATED_CARD_TIMEOUT / 2,
        easing: Easing.out(Easing.ease),
      }),
      withTiming((y ?? 0) - SLIDER_CARD_SIZE.height - 3 + deltaYPlatform, {
        duration: ANIMATED_CARD_TIMEOUT / 2,
        easing: Easing.inOut(Easing.ease),
      })
    );

    scale.value = withSequence(
      withTiming(1, {
        duration: ANIMATED_CARD_TIMEOUT,
        easing: Easing.inOut(Easing.ease),
      })
    );

    // откат карточки на прежнее место
    setTimeout(async () => {
      await handleVibrationClick?.();
      opacity.value = 0;
      rotate.value = 0;
      translateX.value = prevPositionRef.current.x;
      translateY.value = prevPositionRef.current.y;
      rotateAnimation.flipImmediately();
    }, ANIMATED_CARD_TIMEOUT + 10);
  };

  return {
    animatedStyle,
    handleAnimate,
    handleGetCenterCardPosition,
    ...rotateAnimation,
  };
}
