import { useCallback, useMemo, useRef, useState } from 'react';
import {
  GestureResponderEvent,
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
const ARROW_GAP = 10;

function readPointerPoint(event: {
  nativeEvent?: { pageX?: number; pageY?: number };
  pageX?: number;
  pageY?: number;
  clientX?: number;
  clientY?: number;
}): { x: number; y: number } {
  return {
    x:
      event.nativeEvent?.pageX ??
      event.pageX ??
      event.clientX ??
      0,
    y:
      event.nativeEvent?.pageY ??
      event.pageY ??
      event.clientY ??
      0,
  };
}

type TCoverFlowCardCarouselProps = {
  hasImmediateAnimation?: boolean;
  style?: StyleProp<ViewStyle>;
  onAdditionalClick?: () => void;
  /** Стрелки по центру карточки (по высоте). */
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

  const sidePad = ARROW_SIZE + ARROW_GAP;
  const carouselWidth = useMemo(() => {
    const available = Math.max(200, screenWidth - 32);
    return Math.max(180, Math.min(320, available - sidePad * 2));
  }, [screenWidth]);
  const cardWidth = useMemo(
    () => Math.round(Math.max(140, carouselWidth * 0.62)),
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
  const showOverlayArrows = overlayControls || Platform.OS === 'web';
  const shellWidth = carouselWidth + (showOverlayArrows ? sidePad * 2 : 0);
  const [panEnabled, setPanEnabled] = useState(true);
  const pointerStartRef = useRef({ x: 0, y: 0, decided: false });

  const handlePointerDown = (event: GestureResponderEvent) => {
    const point = readPointerPoint(event);
    pointerStartRef.current = { x: point.x, y: point.y, decided: false };
    setPanEnabled(true);
  };

  const handlePointerMove = (event: GestureResponderEvent) => {
    if (pointerStartRef.current.decided) {
      return;
    }
    const point = readPointerPoint(event);
    const dx = Math.abs(point.x - pointerStartRef.current.x);
    const dy = Math.abs(point.y - pointerStartRef.current.y);
    if (dx < 10 && dy < 10) {
      return;
    }
    pointerStartRef.current.decided = true;
    if (dy > dx) {
      setPanEnabled(false);
    }
  };

  const handlePointerUp = () => {
    pointerStartRef.current.decided = false;
    setPanEnabled(true);
  };

  return (
    <View
      style={[
        styles.container,
        showOverlayArrows && styles.containerOverlay,
        showOverlayArrows && {
          width: shellWidth,
          height: carouselHeight,
        },
        style,
      ]}
      onStartShouldSetResponderCapture={() => false}
      onMoveShouldSetResponderCapture={() => false}
      onResponderGrant={handlePointerDown}
      onResponderMove={handlePointerMove}
      onResponderRelease={handlePointerUp}
      onResponderTerminate={handlePointerUp}
      {...(Platform.OS === 'web'
        ? ({
            'data-tarot-no-swipe-back': true,
            onPointerDown: handlePointerDown,
            onPointerMove: handlePointerMove,
            onPointerUp: handlePointerUp,
            onPointerCancel: handlePointerUp,
          } as object)
        : {})}
    >
      <Carousel
        ref={ref}
        data={CAROUSEL_DATA}
        loop={true}
        width={carouselWidth}
        height={carouselHeight}
        enabled={panEnabled}
        scrollAnimationDuration={1100}
        mode="parallax"
        modeConfig={{
          parallaxScrollingScale: 0.86,
          parallaxScrollingOffset: 54,
        }}
        style={[
          styles.carousel,
          showOverlayArrows && styles.carouselOverlay,
          { width: carouselWidth, height: carouselHeight },
        ]}
        pagingEnabled={true}
        snapEnabled={true}
        onConfigurePanGesture={(gesture) => {
          gesture.activeOffsetX([-28, 28]);
          gesture.failOffsetY([-8, 8]);
        }}
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
      {showOverlayArrows ? (
        <>
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
    justifyContent: 'center',
  },
  carousel: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    zIndex: 1,
    overflow: 'visible',
    ...(Platform.OS === 'web'
      ? ({ touchAction: 'pan-x pan-y' } as object)
      : {}),
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
    width: ARROW_SIZE,
    height: ARROW_SIZE,
    borderRadius: ARROW_SIZE / 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    backgroundColor: 'rgba(12,19,33,0.62)',
    alignItems: 'center',
    justifyContent: 'center',
    ...({
      cursor: 'pointer',
      boxShadow: '0 8px 16px rgba(0,0,0,0.32)',
      ...WEB_HOVER_TRANSITION,
    } as object),
  },
  controlButtonLeft: {
    position: 'absolute',
    left: 0,
    top: '50%',
    marginTop: -(ARROW_SIZE / 2),
    zIndex: 4,
    ...Platform.select({
      web: { pointerEvents: 'auto' as const },
      default: {},
    }),
  },
  controlButtonRight: {
    position: 'absolute',
    right: 0,
    top: '50%',
    marginTop: -(ARROW_SIZE / 2),
    zIndex: 4,
    ...Platform.select({
      web: { pointerEvents: 'auto' as const },
      default: {},
    }),
  },
  rightChevron: {
    transform: [{ rotate: '180deg' }],
  },
});

export default CoverFlowCardCarousel;
