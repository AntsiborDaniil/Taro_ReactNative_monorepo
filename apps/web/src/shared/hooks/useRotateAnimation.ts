import { ViewStyle } from 'react-native';
import { StyleProp } from 'react-native/Libraries/StyleSheet/StyleSheet';
import {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

export type TRotateAnimationHookResult = {
  backAnimatedStyle: StyleProp<ViewStyle>;
  frontAnimatedStyle: StyleProp<ViewStyle>;
  flip: () => void;
  flipImmediately: () => void;
};

type TRotateAnimationHookParams = { duration?: number };

export function useRotateAnimation(
  params?: TRotateAnimationHookParams
): TRotateAnimationHookResult {
  const rotation = useSharedValue(0);

  const backAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { perspective: 1000 }, // Добавляем перспективу для 3D-эффекта
        { rotateY: `${rotation.value}deg` },
      ],
    };
  });

  const frontAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${rotation.value + 180}deg` },
      ],
    };
  });

  const flip = () => {
    rotation.value = withTiming(rotation.value === 0 ? 180 : 0, {
      duration: params?.duration ?? 500,
    });
  };

  const flipImmediately = () => {
    rotation.value = rotation.value === 0 ? 180 : 0;
  };

  return {
    backAnimatedStyle,
    frontAnimatedStyle,
    flip,
    flipImmediately,
  };
}
