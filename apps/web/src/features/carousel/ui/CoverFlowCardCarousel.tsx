import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { useTranslation } from 'react-i18next';
import { StyleProp } from 'react-native/Libraries/StyleSheet/StyleSheet';
import type { ICarouselInstance } from 'react-native-reanimated-carousel';
import Carousel from 'react-native-reanimated-carousel';
import { useData } from 'shared/DataProvider';
import { ChevronLeftIcon } from 'shared/icons';
import { WEB_HOVER_TRANSITION } from 'shared/lib';
import SlideItem from './SlideItem';

const CAROUSEL_DATA = [...Array(7)];
const ARROW_SIZE = 42;

type TCoverFlowCardCarouselProps = {
  hasImmediateAnimation?: boolean;
  style?: StyleProp<ViewStyle>;
  onAdditionalClick?: () => void;
  /** Kept for callers; arrows are always centered on the card. */
  overlayControls?: boolean;
};

function CoverFlowCardCarousel({
  style,
  hasImmediateAnimation,
  onAdditionalClick,
}: TCoverFlowCardCarouselProps) {
  const { t } = useTranslation();
  const { width: screenWidth } = useWindowDimensions();

  const { handleVibrationClick } = useData({
    Context: ApplicationConfigContext,
  });

  const ref = useRef<ICarouselInstance>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const prevIndexRef = useRef(0);

  const handleSnapToItem = useCallback(
    async (index: number) => {
      if (index === prevIndexRef.current) return;
      prevIndexRef.current = index;
      setCurrentIndex(index);
      await handleVibrationClick?.();
    },
    [handleVibrationClick]
  );

  const stageWidth = useMemo(
    () => Math.max(240, Math.min(480, screenWidth - 24)),
    [screenWidth]
  );
  const carouselWidth = useMemo(
    () => Math.max(200, Math.min(360, stageWidth - ARROW_SIZE * 2 - 16)),
    [stageWidth]
  );
  const cardWidth = useMemo(
    () => Math.round(Math.max(150, carouselWidth * 0.62)),
    [carouselWidth]
  );
  const cardHeight = useMemo(() => Math.round(cardWidth * 1.8), [cardWidth]);

  const handleAdditionalClick = () => {
    onAdditionalClick?.();
  };

  const handlePrev = async () => {
    await handleVibrationClick?.();
    ref.current?.prev();
  };

  const handleNext = async () => {
    await handleVibrationClick?.();
    ref.current?.next();
  };

  const carouselHeight = cardHeight;

  return (
    <View
      style={[
        styles.container,
        { width: stageWidth, height: carouselHeight },
        style,
      ]}
      {...(Platform.OS === 'web'
        ? ({ 'data-tarot-no-swipe-back': true, 'data-tarot-carousel': true } as object)
        : {})}
    >
      <Carousel
        ref={ref}
        data={CAROUSEL_DATA}
        loop={true}
        width={carouselWidth}
        height={carouselHeight}
        scrollAnimationDuration={1100}
        enabled={Platform.OS !== 'web'}
        mode="parallax"
        modeConfig={{
          parallaxScrollingScale: 0.86,
          parallaxScrollingOffset: 54,
        }}
        style={[styles.carousel, { width: carouselWidth, height: carouselHeight }]}
        pagingEnabled={true}
        snapEnabled={true}
        onSnapToItem={handleSnapToItem}
        onConfigurePanGesture={
          Platform.OS === 'web'
            ? (gesture) => {
                gesture.enabled(false);
              }
            : (gesture) => {
                'worklet';
                gesture.activeOffsetX([-16, 16]);
                gesture.failOffsetY([-12, 12]);
              }
        }
        renderItem={({ index }) => {
          return (
            <SlideItem
              index={index}
              hasImmediateAnimation={hasImmediateAnimation}
              isSelected={index === currentIndex}
              onAdditionalClick={handleAdditionalClick}
              style={{ width: cardWidth, height: cardHeight }}
            />
          );
        }}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('core:button.prev')}
        onPress={handlePrev}
        style={[styles.controlButton, styles.controlButtonLeft]}
      >
        <ChevronLeftIcon width={28} height={28} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('core:button.next')}
        onPress={handleNext}
        style={[styles.controlButton, styles.controlButtonRight]}
      >
        <ChevronLeftIcon width={28} height={28} style={styles.rightChevron} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 1,
    overflow: 'visible',
  },
  carousel: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  controlButton: {
    width: ARROW_SIZE,
    height: ARROW_SIZE,
    borderRadius: ARROW_SIZE / 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    backgroundColor: 'rgba(12,19,33,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -(ARROW_SIZE / 2) }],
    zIndex: 12,
    ...({
      cursor: 'pointer',
      boxShadow: '0 8px 16px rgba(0,0,0,0.32)',
      ...WEB_HOVER_TRANSITION,
    } as object),
    ...Platform.select({
      web: { pointerEvents: 'auto' as const },
      default: {},
    }),
  },
  controlButtonLeft: {
    left: 0,
  },
  controlButtonRight: {
    right: 0,
  },
  rightChevron: {
    transform: [{ rotate: '180deg' }],
  },
});

export default CoverFlowCardCarousel;
