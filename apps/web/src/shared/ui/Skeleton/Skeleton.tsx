import { useEffect, useRef } from 'react';
import {
  Animated,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { COLORS } from 'shared/themes';

const SKELETON_BASE = 'rgba(255, 255, 255, 0.06)';
const SKELETON_SHIMMER = 'rgba(255, 255, 255, 0.1)';

type SkeletonProps = {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
};

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = 10,
  style,
}: SkeletonProps) {
  const shimmerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerOpacity, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerOpacity, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmerOpacity]);

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.base,
        {
          width,
          height,
          borderRadius,
          borderColor: COLORS.SpbSky3,
        },
        style,
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          styles.shimmer,
          { borderRadius, opacity: shimmerOpacity },
        ]}
      />
    </View>
  );
}

export function SkeletonRow({
  gap = 12,
  children,
  style,
}: {
  gap?: number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[{ gap }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: SKELETON_BASE,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  shimmer: {
    backgroundColor: SKELETON_SHIMMER,
  },
});
