import { useRef, useState } from 'react';
import { Platform, StyleSheet, View, ViewStyle, useWindowDimensions } from 'react-native';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { useTranslation } from 'react-i18next';
import { StyleProp } from 'react-native/Libraries/StyleSheet/StyleSheet';
import { Extrapolation, interpolate } from 'react-native-reanimated';
import type { ICarouselInstance } from 'react-native-reanimated-carousel';
import Carousel from 'react-native-reanimated-carousel';
import { SLIDER_CARD_SIZE } from 'shared/constants';
import { useData } from 'shared/DataProvider';
import { ArrowsIcon, ChoiceTriangle } from 'shared/icons';
import { Text } from 'shared/ui';
import { withAnchorPoint } from '../lib';
import SlideItem from './SlideItem';

const defaultDataWith6Colors = [...Array(11)];

// Computed ONCE outside the worklet — Platform.OS is not accessible inside worklets on native
const isWeb = Platform.OS === 'web';

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
  // Reactive window width so the carousel adapts when the window is resized
  const { width: windowWidth } = useWindowDimensions();

  const { handleVibrationClick } = useData({
    Context: ApplicationConfigContext,
  });

  const ref = useRef<ICarouselInstance>(null);
  // Track current index reactively so SlideItem.isSelected updates correctly
  const [currentIndex, setCurrentIndex] = useState(0);

  const baseOptions = {
    vertical: false,
    ...SLIDER_CARD_SIZE,
  } as const;

  const prevIndexRef = useRef(0);

  const handleAdditionalClick = () => {
    ref.current?.next();
    onAdditionalClick?.();
  };

  return (
    <View style={[styles.container, { width: windowWidth }, style]}>
      <View style={[styles.text, { width: windowWidth }]}>
        <Text>{t('core:choice.tapToChoice')}</Text>
        <ChoiceTriangle />
      </View>
      <Carousel
        {...baseOptions}
        ref={ref}
        data={defaultDataWith6Colors}
        loop={true}
        style={styles.carousel}
        customAnimation={(value: number) => {
          'worklet';
          const size = baseOptions.width;
          const scale = interpolate(
            value,
            [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5],
            [0.65, 0.7, 0.75, 0.8, 0.9, 1, 0.9, 0.8, 0.75, 0.7, 0.65],
            Extrapolation.CLAMP
          );

          const translate = interpolate(
            value,
            [-2, -1, 0, 1, 2],
            [-size * 1.45, -size * 0.85, 0, size * 0.85, size * 1.45]
          );

          const rotateYDeg = interpolate(
            value,
            [-1, 0, 1],
            [30, 0, -30],
            Extrapolation.CLAMP
          );

          // isWeb is a plain boolean captured via closure — safe inside worklet
          const transform = {
            transform: [
              ...(isWeb ? [{ perspective: 800 }] as any : []),
              { scale },
              { translateX: translate },
              { rotateY: `${rotateYDeg}deg` },
            ],
          };

          return {
            ...withAnchorPoint(
              transform,
              { x: 0.5, y: 0.5 },
              {
                width: baseOptions.width,
                height: baseOptions.height,
              }
            ),
          };
        }}
        pagingEnabled={false}
        snapEnabled={false}
        onProgressChange={async () => {
          const idx = ref.current?.getCurrentIndex() ?? 0;

          if (idx === prevIndexRef.current) return;

          prevIndexRef.current = idx;
          setCurrentIndex(idx);

          await handleVibrationClick?.();
        }}
        renderItem={({ index }) => {
          return (
            <SlideItem
              index={index}
              hasImmediateAnimation={hasImmediateAnimation}
              isSelected={index === currentIndex}
              onAdditionalClick={handleAdditionalClick}
            />
          );
        }}
      />
      <View style={[styles.text, { width: windowWidth }]}>
        <Text>{t('core:choice.scrollCards')}</Text>
        <ArrowsIcon />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  text: {
    alignItems: 'center',
    gap: 8,
  },
  carousel: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
});

export default CoverFlowCardCarousel;
