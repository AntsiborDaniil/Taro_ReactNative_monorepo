import { useRef } from 'react';
import { Dimensions, StyleSheet, View, ViewStyle } from 'react-native';
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

type TCoverFlowCardCarouselProps = {
  hasImmediateAnimation?: boolean;
  style?: StyleProp<ViewStyle>;
  onAdditionalClick?: () => void;
};

const screen = Dimensions.get('screen');

function CoverFlowCardCarousel({
  style,
  hasImmediateAnimation,
  onAdditionalClick,
}: TCoverFlowCardCarouselProps) {
  const { t } = useTranslation();

  const { handleVibrationClick } = useData({
    Context: ApplicationConfigContext,
  });

  const ref = useRef<ICarouselInstance>(null);

  const baseOptions = {
    vertical: false,
    ...SLIDER_CARD_SIZE,
  } as const;

  let prevIndex = 0;

  const handleAdditionalClick = () => {
    ref.current?.next();

    onAdditionalClick?.();
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.text}>
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

          const transform = {
            transform: [
              { scale },
              {
                translateX: translate,
              },
              {
                rotateY: `${interpolate(value, [-1, 0, 1], [30, 0, -30], Extrapolation.CLAMP)}deg`,
              },
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
          const currentIndex = ref.current?.getCurrentIndex();

          if (!currentIndex || currentIndex === prevIndex) {
            return;
          }

          await handleVibrationClick?.();

          prevIndex = currentIndex;
        }}
        renderItem={({ index }) => {
          return (
            <SlideItem
              index={index}
              hasImmediateAnimation={hasImmediateAnimation}
              isSelected={index === ref.current?.getCurrentIndex()}
              onAdditionalClick={handleAdditionalClick}
            />
          );
        }}
      />
      <View style={styles.text}>
        <Text>{t('core:choice.scrollCards')}</Text>
        <ArrowsIcon />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: screen.width },
  text: {
    width: screen.width,
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
