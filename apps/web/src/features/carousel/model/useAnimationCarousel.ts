import { useRef } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
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
import {
  ANIMATED_CARD_TIMEOUT,
  getFlyingCardSize,
  SCHEME_CARD_SIZE,
} from 'shared/constants';
import { useData } from 'shared/DataProvider';
import { useRotateAnimation } from 'shared/hooks';
import { TAnimationCarouselHookResult } from './types';

export function useAnimationCarousel(): TAnimationCarouselHookResult {
  const { width: screenWidth } = useWindowDimensions();
  const flyingCardSize = getFlyingCardSize(screenWidth);

  const { handleVibrationClick } = useData({
    Context: ApplicationConfigContext,
  });

  const prevPositionRef = useRef({
    x: 0,
    y: 0,
  });

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  const { spread } = useData({ Context: SpreadContext });

  const rotateAnimation = useRotateAnimation({ duration: 700 });

  const landingScale =
    Math.min(
      1,
      Math.max(0.28, SCHEME_CARD_SIZE.width / Math.max(1, flyingCardSize.width))
    ) * 1.05;

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
        { rotate: `${rotate.value}deg` },
      ],
      opacity: opacity.value,
      zIndex: opacity.value > 0.01 ? 120 : -1,
    };
  });

  const handleGetCenterCardPosition = (x: number, y: number) => {
    const cardTop = y - flyingCardSize.height * 0.5;
    prevPositionRef.current = { x, y: cardTop };

    translateX.value = x - flyingCardSize.width / 2;
    translateY.value = cardTop;
  };

  const resetFlyingCard = async () => {
    await handleVibrationClick?.();
    opacity.value = withTiming(0, { duration: 160 });
    rotate.value = 0;
    scale.value = 1;
    translateX.value = prevPositionRef.current.x;
    translateY.value = prevPositionRef.current.y;
    rotateAnimation.flipImmediately();
  };

  const handleAnimate = (index?: number) => {
    const slotIndex = spread?.selectedCards?.length ?? 0;
    const targetPosition = spread?.cardsPosition?.[slotIndex];
    const duration = ANIMATED_CARD_TIMEOUT;

    opacity.value = withTiming(1, { duration: 120 });
    scale.value = withSequence(
      withTiming(1.06, { duration: duration * 0.18, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: duration * 0.12 })
    );

    if (!targetPosition) {
      translateY.value = withSequence(
        withTiming(translateY.value - 96, {
          duration: duration * 0.45,
          easing: Easing.out(Easing.cubic),
        }),
        withTiming(translateY.value, {
          duration: duration * 0.35,
          easing: Easing.inOut(Easing.cubic),
        })
      );

      setTimeout(() => {
        void resetFlyingCard();
      }, duration + 40);

      return;
    }

    const isHorizontalCard =
      typeof index === 'number' && spread?.horizontalPosition?.includes(index);

    const positionIndex = isHorizontalCard ? 1 : spread?.selectedCards.length;
    const { x, y } = spread.cardsPosition[positionIndex];

    const targetX = (x ?? 0) - flyingCardSize.width / 2 + SCHEME_CARD_SIZE.width / 2;
    const targetY =
      (y ?? 0) -
      flyingCardSize.height +
      SCHEME_CARD_SIZE.height +
      (Platform.OS === 'android' ? flyingCardSize.height * 0.08 : 0);

    const liftY = translateY.value - 28;

    if (isHorizontalCard) {
      rotate.value = withDelay(
        duration * 0.35,
        withTiming(90, {
          duration: duration * 0.35,
          easing: Easing.inOut(Easing.cubic),
        })
      );
    }

    translateX.value = withSequence(
      withTiming(translateX.value, {
        duration: duration * 0.15,
        easing: Easing.out(Easing.cubic),
      }),
      withTiming(targetX, {
        duration: duration * 0.7,
        easing: Easing.inOut(Easing.cubic),
      })
    );

    translateY.value = withSequence(
      withTiming(liftY, {
        duration: duration * 0.18,
        easing: Easing.out(Easing.cubic),
      }),
      withTiming(targetY, {
        duration: duration * 0.72,
        easing: Easing.inOut(Easing.cubic),
      })
    );

    scale.value = withSequence(
      withTiming(1.06, { duration: duration * 0.15 }),
      withTiming(landingScale, {
        duration: duration * 0.75,
        easing: Easing.inOut(Easing.cubic),
      })
    );

    setTimeout(() => {
      void resetFlyingCard();
    }, duration + 40);
  };

  return {
    animatedStyle,
    flyingCardSize,
    handleAnimate,
    handleGetCenterCardPosition,
    ...rotateAnimation,
  };
}
