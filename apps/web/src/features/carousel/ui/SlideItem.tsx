import React, { memo, useEffect, useRef } from 'react';
import {
  ImageSourcePropType,
  LayoutChangeEvent,
  Pressable,
  type StyleProp,
  StyleSheet,
  Platform,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import { SpreadContext } from 'entities/Spread';
import type { AnimatedProps } from 'react-native-reanimated';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { ANIMATED_CARD_TIMEOUT } from 'shared/constants';
import { useData } from 'shared/DataProvider';
import { getImage } from 'shared/lib';
import { measurePageCenter } from 'shared/lib/measurePageCoordinates';
import { COLORS } from 'shared/themes';
import { AnimationCarouselContext } from '../model';

interface Props extends AnimatedProps<ViewProps> {
  index: number;
  isSelected?: boolean;
  hasImmediateAnimation?: boolean;
  style?: StyleProp<ViewStyle>;
  source?: ImageSourcePropType;
  onAdditionalClick?: () => void;
}

function SlideItem({
  index,
  style,
  isSelected,
  onAdditionalClick,
  hasImmediateAnimation,
  ...animatedViewProps
}: Props) {
  const DAY_CARD_DEBUG = '[DayCardFlow]';
  const { handleAnimate, handleGetCenterCardPosition, flip } = useData({
    Context: AnimationCarouselContext,
  });

  const { handleSelectTarotCard, handlePreSelectTarotCard, spread } = useData({
    Context: SpreadContext,
  });

  const isAnimating = useRef(false);
  const pressableRef = useRef<React.ComponentRef<typeof Pressable>>(null);
  const pressScale = useSharedValue(1);
  const selectGlow = useSharedValue(0);

  const pressAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
    borderColor: `rgba(246, 192, 27, ${0.2 + selectGlow.value * 0.8})`,
    borderWidth: 1 + selectGlow.value * 2,
  }));

  useEffect(() => {
    if (!isSelected) {
      selectGlow.value = withTiming(0, { duration: 180 });
    }
  }, [isSelected, selectGlow]);

  const syncCardPosition = (event?: LayoutChangeEvent) => {
    if (event) {
      measurePageCenter(event, (pageX, pageY, width, height) => {
        handleGetCenterCardPosition?.(pageX, pageY, width, height);
      });
      return;
    }

    if (Platform.OS === 'web') {
      const node = pressableRef.current as unknown as HTMLElement | null;
      const rect = node?.getBoundingClientRect?.();
      if (!rect) {
        return;
      }

      handleGetCenterCardPosition?.(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
        rect.width,
        rect.height
      );
    }
  };

  const handlePress = () => {
    if (!isSelected || isAnimating.current) {
      if (__DEV__) {
        console.log(`${DAY_CARD_DEBUG} slidePress:ignored`, {
          isSelected,
          isAnimating: isAnimating.current,
        });
      }
      return;
    }

    isAnimating.current = true;
    pressScale.value = withSequence(
      withSpring(0.9, { damping: 14, stiffness: 320 }),
      withSpring(1.04, { damping: 12, stiffness: 260 }),
      withSpring(1, { damping: 16, stiffness: 280 })
    );

    const preSelectedTarotCard = handlePreSelectTarotCard?.();
    if (__DEV__) {
      console.log(`${DAY_CARD_DEBUG} slidePress:start`, {
        preSelectedCardId: preSelectedTarotCard?.id,
        spreadId: spread?.id,
        selectedCardsLength: spread?.selectedCards?.length ?? 0,
      });
    }

    syncCardPosition();

    handleAnimate?.(spread?.selectedCards.length);

    flip?.();

    setTimeout(
      async () => {
        const cardWasSelected = await handleSelectTarotCard?.(preSelectedTarotCard);
        if (__DEV__) {
          console.log(`${DAY_CARD_DEBUG} slidePress:afterSelect`, {
            cardWasSelected: !!cardWasSelected,
          });
        }
        if (cardWasSelected) {
          selectGlow.value = withSequence(
            withTiming(1, { duration: 160 }),
            withTiming(0.35, { duration: 420 })
          );
          onAdditionalClick?.();
          if (__DEV__) {
            console.log(`${DAY_CARD_DEBUG} slidePress:navigate`);
          }
        } else if (__DEV__) {
          console.warn(`${DAY_CARD_DEBUG} slidePress:skipNavigate`);
        }

        isAnimating.current = false;
      },
      hasImmediateAnimation ? 0 : ANIMATED_CARD_TIMEOUT + 5
    );
  };

  const handleLayoutCard = (event: LayoutChangeEvent) => {
    if (!isSelected) {
      return;
    }

    syncCardPosition(event);
  };

  const onKeyDown =
    Platform.OS === 'web'
      ? (event: any) => {
          const key = event?.nativeEvent?.key ?? event?.key;
          if (key === 'Enter' || key === ' ') {
            event?.preventDefault?.();
            handlePress();
          }
        }
      : undefined;

  return (
    <Pressable
      ref={pressableRef}
      onLayout={handleLayoutCard}
      onPress={handlePress}
      accessibilityRole="button"
      // @ts-ignore web-only keyboard event
      onKeyDown={onKeyDown}
      style={styles.pressable}
    >
      <Animated.View
        style={[styles.container, style, pressAnimatedStyle]}
        {...animatedViewProps}
      >
        <Animated.View style={isSelected ? null : styles.overlay} />
        <Animated.Image
          style={styles.card}
          source={getImage(['core', `cardBack`])}
          resizeMode="cover"
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    ...({
      boxShadow: '0 18px 28px rgba(0,0,0,0.35)',
    } as object),
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'black',
    zIndex: 5,
    borderRadius: 11,
    opacity: 0.6,
  },
  card: {
    width: '100%',
    height: '100%',
    borderWidth: 1,
    borderColor: COLORS.Content,
    borderRadius: 12,
    overlayColor: 'black',
  },
});

export default memo(SlideItem);
