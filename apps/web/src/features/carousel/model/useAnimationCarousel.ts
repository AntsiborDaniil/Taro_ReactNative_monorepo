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

const FLIGHT_EASING = Easing.bezier(0.33, 0, 0.2, 1);

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
    sliderHeight = sliderCardSize.height
  ) => {
    const gap = Math.max(6, Math.round(sliderWidth * 0.04));
    const previewW = flyingCardSize.width;
    const previewH = flyingCardSize.height;

    let left = centerX + sliderWidth / 2 + gap;
    const top = centerY + (sliderHeight - previewH) / 2;

    if (left + previewW > screenWidth - 8) {
      left = screenWidth - previewW - 8;
    }

    prevPositionRef.current = { x: left, y: top };
    translateX.value = left;
    translateY.value = top;
    scale.value = 0.92;
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

    opacity.value = withTiming(0, { duration: 220 }, (finished) => {
      if (finished) {
        runOnJS(applyHiddenReset)();
      }
    });
  };

  const handleAnimate = (index?: number) => {
    const slotIndex = spread?.selectedCards?.length ?? 0;
    const targetPosition = spread?.cardsPosition?.[slotIndex];
    const duration = ANIMATED_CARD_TIMEOUT;
    const appearPause = Math.round(duration * 0.18);
    const flyDelay = appearPause + 60;
    const flyDuration = Math.round(duration * 0.78);

    const startX = translateX.value;
    const startY = translateY.value;

    opacity.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) });
    scale.value = withSequence(
      withTiming(1.04, { duration: 200, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 160, easing: Easing.inOut(Easing.cubic) })
    );

    if (!targetPosition) {
      translateX.value = withDelay(
        flyDelay,
        withTiming(startX + 48, {
          duration: flyDuration,
          easing: FLIGHT_EASING,
        })
      );

      setTimeout(() => {
        resetFlyingCard();
      }, flyDelay + flyDuration + 40);

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

    if (isHorizontalCard) {
      rotate.value = withDelay(
        flyDelay + flyDuration * 0.35,
        withTiming(90, {
          duration: flyDuration * 0.4,
          easing: FLIGHT_EASING,
        })
      );
    }

    translateX.value = withDelay(
      flyDelay,
      withTiming(targetX, {
        duration: flyDuration,
        easing: FLIGHT_EASING,
      })
    );

    translateY.value = withDelay(
      flyDelay,
      withTiming(targetY, {
        duration: flyDuration,
        easing: FLIGHT_EASING,
      })
    );

    scale.value = withDelay(
      flyDelay,
      withTiming(landingScale, {
        duration: flyDuration,
        easing: FLIGHT_EASING,
      })
    );

    setTimeout(() => {
      void handleVibrationClick?.();
      resetFlyingCard();
    }, flyDelay + flyDuration + 40);
  };

  return {
    animatedStyle,
    flyingCardSize,
    handleAnimate,
    handleGetCenterCardPosition,
    ...rotateAnimation,
  };
}
