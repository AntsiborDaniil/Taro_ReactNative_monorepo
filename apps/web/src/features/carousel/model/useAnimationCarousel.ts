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
  getFlyingCardSize,
  getSchemeCardSize,
} from 'shared/constants';
import { useData } from 'shared/DataProvider';
import { useRotateAnimation } from 'shared/hooks';
import { TAnimationCarouselHookResult } from './types';

const FLIGHT_EASING = Easing.bezier(0.22, 0.08, 0.12, 1);

export function useAnimationCarousel(): TAnimationCarouselHookResult {
  const { width: screenWidth } = useWindowDimensions();
  const flyingCardSize = getFlyingCardSize(screenWidth);
  const schemeCardSize = getSchemeCardSize(screenWidth);

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

  const isCompact = screenWidth < 380;
  const isWide = screenWidth >= 768;
  const landingScale = Math.min(
    1,
    Math.max(0.32, schemeCardSize.width / Math.max(1, flyingCardSize.width))
  );

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

    opacity.value = withTiming(0, { duration: 180 }, (finished) => {
      if (finished) {
        runOnJS(applyHiddenReset)();
      }
    });
  };

  const handleAnimate = (index?: number) => {
    const slotIndex = spread?.selectedCards?.length ?? 0;
    const targetPosition = spread?.cardsPosition?.[slotIndex];
    const duration = isWide
      ? Math.round(ANIMATED_CARD_TIMEOUT * 0.68)
      : isCompact
        ? Math.round(ANIMATED_CARD_TIMEOUT * 0.92)
        : ANIMATED_CARD_TIMEOUT;
    const liftDelta = isWide ? 12 : isCompact ? 20 : 24;

    opacity.value = withTiming(1, { duration: 100 });
    scale.value = withSequence(
      withTiming(1.03, {
        duration: duration * 0.14,
        easing: Easing.out(Easing.cubic),
      }),
      withTiming(1, { duration: duration * 0.1 })
    );

    if (!targetPosition) {
      translateY.value = withSequence(
        withTiming(translateY.value - (isCompact ? 64 : 80), {
          duration: duration * 0.42,
          easing: Easing.out(Easing.cubic),
        }),
        withTiming(translateY.value, {
          duration: duration * 0.34,
          easing: FLIGHT_EASING,
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

    const targetX =
      (x ?? 0) - flyingCardSize.width / 2 + schemeCardSize.width / 2;
    const targetY =
      (y ?? 0) -
      flyingCardSize.height +
      schemeCardSize.height +
      (Platform.OS === 'android' ? flyingCardSize.height * 0.06 : 0);

    const liftY = translateY.value - liftDelta;

    if (isHorizontalCard) {
      rotate.value = withDelay(
        duration * 0.38,
        withTiming(90, {
          duration: duration * 0.32,
          easing: FLIGHT_EASING,
        })
      );
    }

    translateX.value = withSequence(
      withTiming(translateX.value, {
        duration: duration * 0.12,
        easing: Easing.out(Easing.cubic),
      }),
      withTiming(targetX, {
        duration: duration * 0.68,
        easing: FLIGHT_EASING,
      })
    );

    translateY.value = withSequence(
      withTiming(liftY, {
        duration: duration * 0.16,
        easing: Easing.out(Easing.cubic),
      }),
      withTiming(targetY, {
        duration: duration * 0.7,
        easing: FLIGHT_EASING,
      })
    );

    scale.value = withSequence(
      withTiming(1.03, { duration: duration * 0.12 }),
      withTiming(landingScale, {
        duration: duration * 0.72,
        easing: FLIGHT_EASING,
      })
    );

    opacity.value = withSequence(
      withTiming(1, { duration: 80 }),
      withDelay(
        Math.round(duration * 0.82),
        withTiming(0, { duration: Math.round(duration * 0.14) })
      )
    );

    setTimeout(() => {
      void handleVibrationClick?.();
      resetFlyingCard();
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
