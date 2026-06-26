import { useRef } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { SpreadContext } from 'entities/Spread';
import {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import {
  ANIMATED_CARD_TIMEOUT,
  getCarouselCardSize,
  getFlyingCardSize,
  SCHEME_CARD_SIZE,
} from 'shared/constants';
import { useData } from 'shared/DataProvider';
import { useRotateAnimation } from 'shared/hooks';
import { TAnimationCarouselHookResult } from './types';

export function useAnimationCarousel(): TAnimationCarouselHookResult {
  const { width: screenWidth } = useWindowDimensions();
  const flyingCardSize = getFlyingCardSize(screenWidth);
  const sliderCardSize = getCarouselCardSize(screenWidth);

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
  const { resetToBack } = rotateAnimation;

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

  const handleGetCenterCardPosition = (
    centerX: number,
    centerY: number,
    sliderWidth = sliderCardSize.width,
    _sliderHeight = sliderCardSize.height
  ) => {
    const gap = Math.max(4, Math.round(sliderWidth * 0.05));
    const previewW = flyingCardSize.width;
    const previewH = flyingCardSize.height;

    let left = centerX + sliderWidth / 2 + gap;
    const top = centerY - previewH / 2;

    if (left + previewW > screenWidth - 10) {
      left = centerX - sliderWidth / 2 - gap - previewW;
    }

    if (left < 8) {
      left = Math.max(8, centerX - previewW / 2);
    }

    prevPositionRef.current = { x: left, y: top };
    translateX.value = left;
    translateY.value = top;
    scale.value = 0.9;
    opacity.value = 0;
  };

  const applyHiddenReset = () => {
    rotate.value = 0;
    scale.value = 1;
    translateX.value = prevPositionRef.current.x;
    translateY.value = prevPositionRef.current.y;
    resetToBack();
  };

  const resetFlyingCard = () => {
    if (opacity.value <= 0.01) {
      applyHiddenReset();
      return;
    }

    opacity.value = withTiming(0, { duration: 200 }, (finished) => {
      if (finished) {
        runOnJS(applyHiddenReset)();
      }
    });
  };

  const handleAnimate = (index?: number) => {
    const slotIndex = spread?.selectedCards?.length ?? 0;
    const targetPosition = spread?.cardsPosition?.[slotIndex];
    const isWideLayout = screenWidth >= 768;
    const duration = isWideLayout
      ? Math.round(ANIMATED_CARD_TIMEOUT * 0.78)
      : ANIMATED_CARD_TIMEOUT;
    const liftDelta = isWideLayout ? 12 : 20;
    const appearPause = Math.round(duration * 0.14);

    opacity.value = withTiming(1, { duration: 160 });
    scale.value = withSequence(
      withTiming(1.05, { duration: 180, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 140, easing: Easing.inOut(Easing.cubic) }),
      withDelay(appearPause, withTiming(1, { duration: 1 }))
    );

    if (!targetPosition) {
      translateY.value = withSequence(
        withTiming(translateY.value - 72, {
          duration: duration * 0.45,
          easing: Easing.out(Easing.cubic),
        }),
        withTiming(translateY.value, {
          duration: duration * 0.35,
          easing: Easing.inOut(Easing.cubic),
        })
      );

      setTimeout(() => {
        resetFlyingCard();
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

    const liftY = translateY.value - liftDelta;
    const flyDelay = appearPause + 80;

    if (isHorizontalCard) {
      rotate.value = withDelay(
        flyDelay + duration * 0.3,
        withTiming(90, {
          duration: duration * 0.32,
          easing: Easing.inOut(Easing.cubic),
        })
      );
    }

    translateX.value = withDelay(
      flyDelay,
      withSequence(
        withTiming(translateX.value, {
          duration: duration * 0.1,
          easing: Easing.out(Easing.cubic),
        }),
        withTiming(targetX, {
          duration: duration * 0.68,
          easing: Easing.inOut(Easing.cubic),
        })
      )
    );

    translateY.value = withDelay(
      flyDelay,
      withSequence(
        withTiming(liftY, {
          duration: duration * 0.14,
          easing: Easing.out(Easing.cubic),
        }),
        withTiming(targetY, {
          duration: duration * 0.7,
          easing: Easing.inOut(Easing.cubic),
        })
      )
    );

    scale.value = withDelay(
      flyDelay,
      withSequence(
        withTiming(1.02, { duration: duration * 0.12 }),
        withTiming(landingScale, {
          duration: duration * 0.72,
          easing: Easing.inOut(Easing.cubic),
        })
      )
    );

    setTimeout(() => {
      void handleVibrationClick?.();
      resetFlyingCard();
    }, flyDelay + duration + 40);
  };

  return {
    animatedStyle,
    flyingCardSize,
    handleAnimate,
    handleGetCenterCardPosition,
    ...rotateAnimation,
  };
}
