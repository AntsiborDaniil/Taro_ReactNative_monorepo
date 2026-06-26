import { ViewStyle } from 'react-native';
import { StyleProp } from 'react-native/Libraries/StyleSheet/StyleSheet';
import { TRotateAnimationHookResult } from 'shared/hooks';
import { TSchemeCardSize } from 'shared/types';

export type TAnimationCarouselHookResult = TRotateAnimationHookResult & {
  animatedStyle: StyleProp<ViewStyle>;
  flyingCardSize: TSchemeCardSize;
  handleAnimate: (index?: number) => void;
  handleGetCenterCardPosition: (
    x: number,
    y: number,
    sliderWidth?: number,
    sliderHeight?: number
  ) => void;
};
