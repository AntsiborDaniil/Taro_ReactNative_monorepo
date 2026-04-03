import { ViewStyle } from 'react-native';
import { StyleProp } from 'react-native/Libraries/StyleSheet/StyleSheet';
import { TRotateAnimationHookResult } from 'shared/hooks';

export type TAnimationCarouselHookResult = TRotateAnimationHookResult & {
  animatedStyle: StyleProp<ViewStyle>;
  handleAnimate: (index?: number) => void;
  handleGetCenterCardPosition: (x: number, y: number) => void;
};
