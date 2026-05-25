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
import { COLORS } from 'shared/themes';
import { Text } from 'shared/ui';
import SlideItem from './SlideItem';

const CAROUSEL_DATA = [...Array(7)];

type TCoverFlowCardCarouselProps = {
  hasImmediateAnimation?: boolean;
  style?: StyleProp<ViewStyle>;
  onAdditionalClick?: () => void;
  /** Стрелки и счётчик поверх нижней части карты (мобильный «Совет дня»). */
  overlayControls?: boolean;
};

function CoverFlowCardCarousel({
  style,
  hasImmediateAnimation,
  onAdditionalClick,
  overlayControls = false,
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

  const carouselWidth = useMemo(
    () => Math.max(200, Math.min(360, screenWidth - 56)),
    [screenWidth]
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

  const carouselHeight = cardHeight + 12;
  const ARROW_SIZE = 42;
  const ARROW_GAP_FROM_CARD = 24;
  const sideArrowInset = Math.max(
    -32,
    Math.round((carouselWidth - cardWidth) / 2 - ARROW_SIZE - ARROW_GAP_FROM_CARD)
  );

  return (
    <View
      style={[
        styles.container,
        overlayControls && styles.containerOverlay,
        overlayControls && { width: carouselWidth, height: carouselHeight },
        style,
      ]}
    >
      <Carousel
        ref={ref}
        data={CAROUSEL_DATA}
        loop={true}
        width={carouselWidth}
        height={carouselHeight}
        style={[
          styles.carousel,
          overlayControls && styles.carouselOverlay,
          { width: carouselWidth },
        ]}
        pagingEnabled={true}
        snapEnabled={true}
        onSnapToItem={handleSnapToItem}
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
      {overlayControls ? (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('core:button.prev')}
            onPress={handlePrev}
            style={[
              styles.controlButton,
              styles.controlButtonLeft,
              { left: sideArrowInset },
            ]}
          >
            <ChevronLeftIcon width={28} height={28} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('core:button.next')}
            onPress={handleNext}
            style={[
              styles.controlButton,
              styles.controlButtonRight,
              { right: sideArrowInset },
            ]}
          >
            <ChevronLeftIcon width={28} height={28} style={styles.rightChevron} />
          </Pressable>
          <Text style={styles.counterOverlay}>
            {`${currentIndex + 1} / ${CAROUSEL_DATA.length}`}
          </Text>
        </>
      ) : (
        <View style={styles.controls} pointerEvents="box-none">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('core:button.prev')}
            onPress={handlePrev}
            style={styles.controlButton}
          >
            <ChevronLeftIcon width={28} height={28} />
          </Pressable>
          <Text style={styles.counter}>
            {`${currentIndex + 1} / ${CAROUSEL_DATA.length}`}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('core:button.next')}
            onPress={handleNext}
            style={styles.controlButton}
          >
            <ChevronLeftIcon width={28} height={28} style={styles.rightChevron} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    gap: 8,
    position: 'relative',
    zIndex: 1,
  },
  containerOverlay: {
    gap: 0,
    maxWidth: undefined,
  },
  carousel: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    zIndex: 1,
  },
  carouselOverlay: {
    marginBottom: 0,
  },
  controls: {
    width: '100%',
    maxWidth: 320,
    paddingHorizontal: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  controlButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    backgroundColor: 'rgba(12,19,33,0.62)',
    alignItems: 'center',
    justifyContent: 'center',
    ...({
      cursor: 'pointer',
      boxShadow: '0 8px 16px rgba(0,0,0,0.32)',
    } as object),
  },
  controlButtonLeft: {
    position: 'absolute',
    top: '50%',
    marginTop: -21,
    zIndex: 10,
    ...Platform.select({
      web: { pointerEvents: 'auto' as const },
      default: {},
    }),
  },
  controlButtonRight: {
    position: 'absolute',
    top: '50%',
    marginTop: -21,
    zIndex: 10,
    ...Platform.select({
      web: { pointerEvents: 'auto' as const },
      default: {},
    }),
  },
  counter: {
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 0.4,
    fontSize: 16,
    minWidth: 68,
    textAlign: 'center',
  },
  counterOverlay: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 0.4,
    fontSize: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(12, 19, 33, 0.55)',
    zIndex: 10,
  },
  rightChevron: {
    transform: [{ rotate: '180deg' }],
  },
});

export default CoverFlowCardCarousel;
