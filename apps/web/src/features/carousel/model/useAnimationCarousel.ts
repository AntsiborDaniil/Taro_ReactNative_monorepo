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
  getPreviewCardSize,
  getSchemeCardSize,
} from 'shared/constants';
import { useData } from 'shared/DataProvider';
import { useRotateAnimation } from 'shared/hooks';
import { TAnimationCarouselHookResult } from './types';

const FLIGHT_EASING = Easing.bezier(0.22, 0.08, 0.12, 1);

export function useAnimationCarousel(): TAnimationCarouselHookResult {
  const { width: screenWidth } = useWindowDimensions();
  const carouselCardSize = getCarouselCardSize(screenWidth);
  const flyingCardSize = getPreviewCardSize(screenWidth, carouselCardSize);
  const schemeCardSize = getSchemeCardSize(screenWidth);

  const { handleVibrationClick } = useData({
    Context: ApplicationConfigContext,
  });

  const sliderSizeRef = useRef(carouselCardSize);
  const prevPositionRef = useRef({ x: 0, y: 0 });

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

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
    zIndex: opacity.value > 0.01 ? 120 : -1,
  }));

  const placePreviewBesideSlider = (
    centerX: number,
    centerY: number,
    sliderWidth = sliderSizeRef.current.width,
    sliderHeight = sliderSizeRef.current.height
  ) => {
    sliderSizeRef.current = { width: sliderWidth, height: sliderHeight };

    const gap = isCompact ? 5 : isWide ? 12 : 8;
    const previewW = flyingCardSize.width;
    const previewH = flyingCardSize.height;

    let previewCenterX =
      centerX + sliderWidth / 2 + gap + previewW / 2;

    const rightOverflow =
      previewCenterX + previewW / 2 - (screenWidth - 10);
    if (rightOverflow > 0) {
      previewCenterX =
        centerX - sliderWidth / 2 - gap - previewW / 2;
    }

    const leftOverflow = previewCenterX - previewW / 2 - 10;
    if (leftOverflow < 0) {
      previewCenterX = centerX + sliderWidth / 2 + gap + previewW / 2;
    }

    const previewTop = centerY - previewH * 0.5;
    const previewLeft = previewCenterX - previewW / 2;

    prevPositionRef.current = { x: previewLeft, y: previewTop };
    translateX.value = previewLeft;
    translateY.value = previewTop;
  };

  const handleGetCenterCardPosition = (
    x: number,
    y: number,
    sliderWidth?: number,
    sliderHeight?: number
  ) => {
    placePreviewBesideSlider(
      x,
      y,
      sliderWidth ?? carouselCardSize.width,
      sliderHeight ?? carouselCardSize.height
    );
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

    opacity.value = withTiming(0, { duration: 160 }, (finished) => {
      if (finished) {
        runOnJS(applyHiddenReset)();
      }
    });
  };

  const handleAnimate = (index?: number) => {
    const slotIndex = spread?.selectedCards?.length ?? 0;
    const targetPosition = spread?.cardsPosition?.[slotIndex];
    const duration = isWide
      ? Math.round(ANIMATED_CARD_TIMEOUT * 0.7)
      : isCompact
        ? Math.round(ANIMATED_CARD_TIMEOUT * 0.95)
        : ANIMATED_CARD_TIMEOUT;
    const holdAtSliderMs = Math.round(duration * 0.2);
    const liftDelta = isWide ? 10 : isCompact ? 14 : 18;

    const startX = translateX.value;
    const startY = translateY.value;

    opacity.value = withTiming(1, { duration: 90 });
    scale.value = withSequence(
      withTiming(1.08, {
        duration: holdAtSliderMs * 0.45,
        easing: Easing.out(Easing.cubic),
      }),
      withTiming(1, {
        duration: holdAtSliderMs * 0.55,
        easing: Easing.inOut(Easing.cubic),
      })
    );

    if (!targetPosition) {
      translateY.value = withSequence(
        withTiming(startY, { duration: holdAtSliderMs }),
        withTiming(startY - (isCompact ? 48 : 64), {
          duration: duration * 0.4,
          easing: Easing.out(Easing.cubic),
        }),
        withTiming(startY, {
          duration: duration * 0.32,
          easing: FLIGHT_EASING,
        })
      );

      setTimeout(() => {
        resetFlyingCard();
      }, duration + holdAtSliderMs);

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
      (Platform.OS === 'android' ? flyingCardSize.height * 0.05 : 0);

    const liftY = startY - liftDelta;

    if (isHorizontalCard) {
      rotate.value = withDelay(
        holdAtSliderMs + duration * 0.35,
        withTiming(90, {
          duration: duration * 0.32,
          easing: FLIGHT_EASING,
        })
      );
    }

    translateX.value = withSequence(
      withTiming(startX, {
        duration: holdAtSliderMs,
        easing: Easing.out(Easing.cubic),
      }),
      withTiming(targetX, {
        duration: duration * 0.68,
        easing: FLIGHT_EASING,
      })
    );

    translateY.value = withSequence(
      withTiming(startY, {
        duration: holdAtSliderMs * 0.55,
        easing: Easing.out(Easing.cubic),
      }),
      withTiming(liftY, {
        duration: duration * 0.14,
        easing: Easing.out(Easing.cubic),
      }),
      withTiming(targetY, {
        duration: duration * 0.68,
        easing: FLIGHT_EASING,
      })
    );

    scale.value = withSequence(
      withTiming(1.08, { duration: holdAtSliderMs * 0.4 }),
      withTiming(1, { duration: holdAtSliderMs * 0.6 }),
      withTiming(landingScale, {
        duration: duration * 0.7,
        easing: FLIGHT_EASING,
      })
    );

    setTimeout(() => {
      void handleVibrationClick?.();
      resetFlyingCard();
    }, holdAtSliderMs + duration + 40);
  };

  return {
    animatedStyle,
    flyingCardSize,
    handleAnimate,
    handleGetCenterCardPosition,
    ...rotateAnimation,
  };
}
