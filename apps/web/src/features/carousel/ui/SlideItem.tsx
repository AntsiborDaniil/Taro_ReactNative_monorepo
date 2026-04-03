import React, { memo, useRef } from 'react';
import {
  ImageSourcePropType,
  type ImageStyle,
  LayoutChangeEvent,
  type StyleProp,
  StyleSheet,
  TouchableWithoutFeedback,
  type ViewProps,
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
  style?: StyleProp<ImageStyle>;
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
      () => {
        handleSelectTarotCard?.(preSelectedTarotCard);

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

    event.target.measure((x, y, width, height, pageX, pageY) => {
      handleGetCenterCardPosition?.(pageX, pageY);
    });
  };

  return (
    <TouchableWithoutFeedback onLayout={handleLayoutCard} onPress={handlePress}>
      <Animated.View style={styles.container} {...animatedViewProps}>
        <Animated.View style={isSelected ? null : styles.overlay} />
        <Animated.Image
          style={[style, styles.card]}
          source={getImage(['core', `cardBack`])}
          resizeMode="cover"
        />
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
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
