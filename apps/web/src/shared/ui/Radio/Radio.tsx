import { ReactElement, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { DS_COLORS } from 'shared/themes/ds';

export type RadioProps = {
  checked?: boolean;
  onPress?: () => void;
};

function Radio({ checked }: RadioProps): ReactElement {
  const colorProgress = useSharedValue(checked ? 1 : 0);
  const opacityProgress = useSharedValue(checked ? 1 : 0);

  const animatedColor = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      colorProgress.value,
      [0, 1],
      [DS_COLORS.ground600, DS_COLORS.accent400]
    );
    return { borderColor };
  });

  const animatedCircle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(opacityProgress.value, { duration: 200 }),
    };
  });

  useEffect(() => {
    colorProgress.value = withTiming(checked ? 1 : 0, { duration: 300 });
    opacityProgress.value = withTiming(checked ? 1 : 0, { duration: 200 });
  }, [checked, colorProgress, opacityProgress]);

  return (
    <Animated.View style={[styles.wrapper, animatedColor]}>
      <Animated.View style={[styles.checkedCircle, animatedCircle]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: 24,
    height: 24,
    borderRadius: 20,
    borderWidth: 2,
    padding: 4,
  },
  checkedCircle: {
    backgroundColor: DS_COLORS.accent400,
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
});

export default Radio;
