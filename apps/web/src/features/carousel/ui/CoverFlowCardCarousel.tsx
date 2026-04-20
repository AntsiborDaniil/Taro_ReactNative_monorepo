import { useCallback, useMemo, useRef, useState } from 'react';
import {
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

  return (
    <View style={[styles.container, style]}>
      <Carousel
        ref={ref}
        data={CAROUSEL_DATA}
        loop={true}
        width={carouselWidth}
        height={cardHeight + 12}
        style={[styles.carousel, { width: carouselWidth }]}
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
      <View style={styles.controls}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('core:button.prev')}
          onPress={handlePrev}
          style={styles.controlButton}
        >
          <ChevronLeftIcon width={28} height={28} />
        </Pressable>
        <Text style={styles.counter}>{`${currentIndex + 1} / ${CAROUSEL_DATA.length}`}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('core:button.next')}
          onPress={handleNext}
          style={styles.controlButton}
        >
          <ChevronLeftIcon width={28} height={28} style={styles.rightChevron} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    gap: 8,
  },
  carousel: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
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
  counter: {
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 0.4,
    fontSize: 16,
    minWidth: 68,
    textAlign: 'center',
  },
  rightChevron: {
    transform: [{ rotate: '180deg' }],
  },
});

export default CoverFlowCardCarousel;
