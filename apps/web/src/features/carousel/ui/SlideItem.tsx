import React, { memo, useRef } from 'react';
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
import Animated from 'react-native-reanimated';
import { ANIMATED_CARD_TIMEOUT } from 'shared/constants';
import { useData } from 'shared/DataProvider';
import { getImage } from 'shared/lib';
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
  const { handleAnimate, handleGetCenterCardPosition, flip } = useData({
    Context: AnimationCarouselContext,
  });

  const { handleSelectTarotCard, handlePreSelectTarotCard, spread } = useData({
    Context: SpreadContext,
  });

  const isAnimating = useRef(false);

  const handlePress = () => {
    if (!isSelected || isAnimating.current) {
      return;
    }

    isAnimating.current = true;

    const preSelectedTarotCard = handlePreSelectTarotCard?.();

    handleAnimate?.(spread?.selectedCards.length);

    flip?.();

    setTimeout(
      async () => {
        await handleSelectTarotCard?.(preSelectedTarotCard);

        onAdditionalClick?.();

        isAnimating.current = false;
      },
      hasImmediateAnimation ? 0 : ANIMATED_CARD_TIMEOUT + 5
    );
  };

  const handleLayoutCard = (event: LayoutChangeEvent) => {
    if (index !== 0) {
      return;
    }

    if (Platform.OS === 'web') {
      const node = event.currentTarget as unknown as HTMLElement | null;
      const rect = node?.getBoundingClientRect?.();
      if (!rect) {
        return;
      }
      handleGetCenterCardPosition?.(rect.left, rect.top);
      return;
    }

    const measuredNode = event.target as unknown as {
      measure?: (
        cb: (
          x: number,
          y: number,
          width: number,
          height: number,
          pageX: number,
          pageY: number
        ) => void
      ) => void;
    };
    measuredNode.measure?.((x, y, width, height, pageX, pageY) => {
      handleGetCenterCardPosition?.(pageX, pageY);
    });
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
      onLayout={handleLayoutCard}
      onPress={handlePress}
      accessibilityRole="button"
      // @ts-ignore web-only keyboard event
      onKeyDown={onKeyDown}
      style={styles.pressable}
    >
      <Animated.View style={[styles.container, style]} {...animatedViewProps}>
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
    borderColor: 'white',
    borderRadius: 12,
    overlayColor: 'black',
  },
});

export default memo(SlideItem);
