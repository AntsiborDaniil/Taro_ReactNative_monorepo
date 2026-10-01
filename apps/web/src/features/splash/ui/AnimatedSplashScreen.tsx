import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { getImage } from 'shared/lib';
import { DS_COLORS } from 'shared/themes/ds';

type AnimatedSplashScreenProps = {
  isLoading?: boolean;
};

/**
 * DS: без бесконечных пульсаций/scale-глитчей — картинка статична, пока грузится,
 * и один раз плавно уходит (opacity), когда загрузка завершена.
 */
function AnimatedSplashScreen({ isLoading = true }: AnimatedSplashScreenProps) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (isLoading) {
      opacity.value = 1;
      return;
    }

    opacity.value = withTiming(0, {
      duration: 400,
      easing: Easing.out(Easing.ease),
    });
  }, [isLoading, opacity]);

  const girlCardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={styles.container}>
      <Animated.Image
        source={getImage(['core', 'girlCard'])}
        style={[styles.card, styles.girlCard, girlCardStyle]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: DS_COLORS.ground900,
  },
  card: {
    position: 'absolute',
  },
  girlCard: {
    width: 180,
    height: 260,
    zIndex: 100,
  },
});

export default AnimatedSplashScreen;
