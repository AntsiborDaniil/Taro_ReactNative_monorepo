import { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { getImage } from 'shared/lib';
import { COLORS } from 'shared/themes';

type AnimatedSplashScreenProps = {
  isLoading?: boolean;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function AnimatedSplashScreen({ isLoading = true }: AnimatedSplashScreenProps) {
  const scaleLeft = useSharedValue(1);
  const scaleRight = useSharedValue(1);
  const scaleGirl = useSharedValue(1);
  const translateXLeft = useSharedValue(-60);
  const translateXRight = useSharedValue(65);
  const rotateLeft = useSharedValue(0);
  const rotateRight = useSharedValue(0);

  const scaleAnimation = withRepeat(
    withTiming(1.2, { duration: 500, easing: Easing.inOut(Easing.ease) }),
    -1, // Бесконечное повторение
    true // Реверс анимации
  );

  useEffect(() => {
    if (isLoading) {
      scaleLeft.value = scaleAnimation;
      scaleRight.value = scaleAnimation;
      scaleGirl.value = scaleAnimation;

      return;
    }

    translateXLeft.value = withTiming(-SCREEN_WIDTH, {
      duration: 1500,
      easing: Easing.out(Easing.exp),
    });
    translateXRight.value = withTiming(SCREEN_WIDTH, {
      duration: 1500,
      easing: Easing.out(Easing.exp),
    });
    rotateLeft.value = withTiming(-90, {
      duration: 1500,
      easing: Easing.out(Easing.exp),
    });
    rotateRight.value = withTiming(90, {
      duration: 1500,
      easing: Easing.out(Easing.exp),
    });
    scaleGirl.value = withTiming(0, {
      duration: 1000,
      easing: Easing.out(Easing.exp),
    });
  }, [
    scaleAnimation,
    scaleGirl,
    scaleLeft,
    scaleRight,
    translateXLeft,
    translateXRight,
    rotateLeft,
    rotateRight,
    isLoading,
  ]);

  const leftCardStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scaleLeft.value },
      { translateX: translateXLeft.value },
      { translateY: -10 },
      { rotate: `${rotateLeft.value}deg` },
    ],
  }));

  const rightCardStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scaleRight.value },
      { translateX: translateXRight.value },
      { translateY: -10 },
      { rotate: `${rotateRight.value}deg` },
    ],
  }));

  const girlCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleGirl.value }],
  }));

  return (
    <View style={styles.container}>
      {/*<Animated.Image*/}
      {/*  source={getImage(['core', 'rightCard'])}*/}
      {/*  style={[styles.card, styles.rightCard, rightCardStyle]}*/}
      {/*/>*/}
      <Animated.Image
        source={getImage(['core', 'girlCard'])}
        style={[styles.card, styles.girlCard, girlCardStyle]}
      />
      {/*<Animated.Image*/}
      {/*  source={getImage(['core', 'leftCard'])}*/}
      {/*  style={[styles.card, styles.leftCard, leftCardStyle]}*/}
      {/*/>*/}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.Background,
  },
  card: {
    position: 'absolute',
  },
  leftCard: {
    width: 179,
    height: 220,
  },
  girlCard: {
    width: 180,
    height: 260,
    zIndex: 100,
  },
  rightCard: {
    width: 145,
    height: 220,
  },
});

export default AnimatedSplashScreen;
