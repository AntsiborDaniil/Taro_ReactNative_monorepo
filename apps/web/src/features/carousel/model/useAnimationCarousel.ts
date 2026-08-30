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
const DESKTOP_MIN_WIDTH = 640;
const STAGE_PAD = 12;

/** Carousel / pick cluster that owns the absolute flying card (web). */
function getFlyStageRect(): DOMRect | null {
  if (typeof document === 'undefined') {
    return null;
  }
  const el = document.querySelector(
    '[data-tarot-fly-stage]'
  ) as HTMLElement | null;
  return el?.getBoundingClientRect?.() ?? null;
}

export function useAnimationCarousel(): TAnimationCarouselHookResult {
  const { width: screenWidth } = useWindowDimensions();
  const flyingCardSize = getFlyingCardSize(screenWidth);
  const sliderCardSize = getCarouselCardSize(screenWidth);
  const isDesktopWeb =
    Platform.OS === 'web' && screenWidth >= DESKTOP_MIN_WIDTH;

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

  /** Top-right of the fly stage (carousel block where the user is looking). */
  const placeInStageTopRight = (stageWidth: number, stageHeight?: number) => {
    const left = Math.max(
      STAGE_PAD,
      stageWidth - flyingCardSize.width - STAGE_PAD
    );
    // ~55% of stage height (near carousel), not at the top of the stage
    const top = Math.max(
      STAGE_PAD,
      Math.round((stageHeight ?? 400) * 0.55) - flyingCardSize.height / 2
    );
    prevPositionRef.current = { x: left, y: top };
    translateX.value = left;
    translateY.value = top;
    scale.value = 0.92;
    opacity.value = 0;
  };

  const handleGetCenterCardPosition = (
    centerX: number,
    centerY: number,
    sliderWidth = sliderCardSize.width,
    _sliderHeight = sliderCardSize.height
  ) => {
    const previewW = flyingCardSize.width;
    const previewH = flyingCardSize.height;
    const stage = Platform.OS === 'web' ? getFlyStageRect() : null;

    // Web: coordinates are viewport; convert to stage-local (absolute inside stage).
    if (stage) {
      if (isDesktopWeb) {
        placeInStageTopRight(stage.width, stage.height);
        return;
      }

      const gap = Math.max(10, Math.round(sliderWidth * 0.06));
      let left = centerX - stage.left + sliderWidth / 2 + gap;
      let top = centerY - stage.top - previewH / 2;

      if (left + previewW > stage.width - STAGE_PAD) {
        left = centerX - stage.left - sliderWidth / 2 - gap - previewW;
      }

      left = Math.max(
        STAGE_PAD,
        Math.min(left, stage.width - previewW - STAGE_PAD)
      );
      top = Math.max(
        STAGE_PAD,
        Math.min(top, stage.height - previewH - STAGE_PAD)
      );

      prevPositionRef.current = { x: left, y: top };
      translateX.value = left;
      translateY.value = top;
      scale.value = 0.92;
      opacity.value = 0;
      return;
    }

    // Native / fallback: page-relative absolute in parent
    const gap = Math.max(10, Math.round(sliderWidth * 0.06));
    let left = centerX + sliderWidth / 2 + gap;
    const top = centerY - previewH / 2;

    if (left + previewW > screenWidth - 12) {
      left = centerX - sliderWidth / 2 - gap - previewW;
    }

    left = Math.max(12, Math.min(left, screenWidth - previewW - 12));
    const clampedTop = Math.max(12, top);

    prevPositionRef.current = { x: left, y: clampedTop };
    translateX.value = left;
    translateY.value = clampedTop;
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

    const stage = Platform.OS === 'web' ? getFlyStageRect() : null;
    if (isDesktopWeb && stage && opacity.value < 0.05) {
      placeInStageTopRight(stage.width, stage.height);
    }

    const startX = translateX.value;
    const startY = translateY.value;

    opacity.value = withTiming(1, {
      duration: 200,
      easing: Easing.out(Easing.cubic),
    });
    scale.value = withSequence(
      withTiming(1.04, { duration: 200, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 160, easing: Easing.inOut(Easing.cubic) })
    );

    if (!targetPosition) {
      if (isDesktopWeb) {
        translateX.value = withDelay(
          flyDelay,
          withTiming(startX - 10, {
            duration: flyDuration,
            easing: FLIGHT_EASING,
          })
        );
        translateY.value = withDelay(
          flyDelay,
          withTiming(startY + 14, {
            duration: flyDuration,
            easing: FLIGHT_EASING,
          })
        );
      } else {
        const rise = Math.max(110, Math.round(flyingCardSize.height * 0.55));
        translateX.value = withDelay(
          flyDelay,
          withTiming(startX, { duration: flyDuration, easing: FLIGHT_EASING })
        );
        translateY.value = withDelay(
          flyDelay,
          withTiming(startY - rise, {
            duration: flyDuration,
            easing: FLIGHT_EASING,
          })
        );
      }
      scale.value = withDelay(
        flyDelay,
        withSequence(
          withTiming(1.14, {
            duration: Math.round(flyDuration * 0.4),
            easing: Easing.out(Easing.cubic),
          }),
          withTiming(0.96, {
            duration: Math.round(flyDuration * 0.6),
            easing: FLIGHT_EASING,
          })
        )
      );

      setTimeout(() => {
        void handleVibrationClick?.();
        resetFlyingCard();
      }, flyDelay + flyDuration + 40);

      return;
    }

    const isHorizontalCard =
      typeof index === 'number' && spread?.horizontalPosition?.includes(index);

    const positionIndex = isHorizontalCard ? 1 : spread?.selectedCards.length;
    const { x, y } = spread.cardsPosition[positionIndex];

    // cardsPosition is viewport (web); convert to stage-local for absolute flyer
    const originX = stage?.left ?? 0;
    const originY = stage?.top ?? 0;

    const targetX =
      (x ?? 0) -
      originX -
      flyingCardSize.width / 2 +
      SCHEME_CARD_SIZE.width / 2;
    const targetY =
      (y ?? 0) -
      originY -
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
