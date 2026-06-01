import { memo, useEffect } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
  type PressableStateCallbackType,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LockIcon } from 'shared/icons';
import { WEB_HOVER_TRANSITION } from 'shared/lib';
import { COLORS } from 'shared/themes';
import { Text, TEXT_TAGS, TEXT_WEIGHT } from 'shared/ui';

const STAGGER_MS = 42;
const ENTER_DURATION = 240;

type AffirmationCategoryChipProps = {
  labelKey: string;
  gradient: [string, string];
  width: number;
  height: number;
  fontSize: number;
  index: number;
  animateIn: boolean;
  isSelected: boolean;
  isLocked: boolean;
  onPress: () => void;
};

function AffirmationCategoryChip({
  labelKey,
  gradient,
  width,
  height,
  fontSize,
  index,
  animateIn,
  isSelected,
  isLocked,
  onPress,
}: AffirmationCategoryChipProps) {
  const { t } = useTranslation();

  const enterOpacity = useSharedValue(0);
  const enterScale = useSharedValue(0.9);
  const pressScale = useSharedValue(1);
  const selectedProgress = useSharedValue(isSelected ? 1 : 0);

  useEffect(() => {
    if (!animateIn) {
      return;
    }

    enterOpacity.value = 0;
    enterScale.value = 0.9;

    const delay = index * STAGGER_MS;
    enterOpacity.value = withDelay(
      delay,
      withTiming(1, {
        duration: ENTER_DURATION,
        easing: Easing.out(Easing.cubic),
      })
    );
    enterScale.value = withDelay(
      delay,
      withSpring(1, { damping: 16, stiffness: 220, mass: 0.7 })
    );
  }, [animateIn, index, enterOpacity, enterScale]);

  useEffect(() => {
    selectedProgress.value = withSpring(isSelected ? 1 : 0, {
      damping: 14,
      stiffness: 200,
    });
  }, [isSelected, selectedProgress]);

  const animatedWrapStyle = useAnimatedStyle(() => ({
    opacity: enterOpacity.value,
    transform: [
      { scale: enterScale.value * pressScale.value },
    ],
  }));

  const animatedAccentStyle = useAnimatedStyle(() => ({
    width: 3 + selectedProgress.value,
    backgroundColor:
      selectedProgress.value > 0.5 ? COLORS.Primary : 'rgba(255,255,255,0.35)',
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: selectedProgress.value * 0.35,
  }));

  const pressableStyle = ({
    hovered,
  }: PressableStateCallbackType & { hovered?: boolean }) => [
    styles.chip,
    {
      width,
      height,
      opacity: isLocked ? 0.88 : 1,
    },
    isSelected && styles.chipSelected,
    hovered && styles.chipHovered,
  ];

  const handlePressIn = () => {
    pressScale.value = withTiming(0.97, { duration: 80 });
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1, { damping: 14, stiffness: 280 });
  };

  return (
    <Animated.View style={[{ width, height }, animatedWrapStyle]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t(labelKey)}
        accessibilityState={{ selected: isSelected, disabled: false }}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={pressableStyle}
      >
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View style={[styles.selectedGlow, animatedGlowStyle]} />
        <View style={styles.tint} />
        <View style={styles.inner}>
          <Animated.View style={[styles.accent, animatedAccentStyle]} />
          <Text
            category={TEXT_TAGS.p2}
            weight={isSelected ? TEXT_WEIGHT.medium : TEXT_WEIGHT.regular}
            numberOfLines={2}
            ellipsizeMode="tail"
            style={[
              styles.label,
              { fontSize, lineHeight: Math.round(fontSize * 1.25) },
            ]}
          >
            {t(labelKey)}
          </Text>
          {isLocked ? (
            <View style={styles.lockBadge}>
              <LockIcon width={14} height={14} fill="rgba(255,255,255,0.9)" />
            </View>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    ...(Platform.OS === 'web'
      ? ({
          cursor: 'pointer',
          ...WEB_HOVER_TRANSITION,
          boxShadow: '0 4px 14px rgba(0,0,0,0.22)',
        } as object)
      : {}),
  },
  chipSelected: {
    borderWidth: 2,
    borderColor: COLORS.Primary,
    ...(Platform.OS === 'web'
      ? ({
          boxShadow:
            '0 0 0 1px rgba(246,192,27,0.35), 0 8px 20px rgba(0,0,0,0.28)',
        } as object)
      : {}),
  },
  chipHovered: {
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 8px 22px rgba(0,0,0,0.32)',
        } as object)
      : {}),
  },
  selectedGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.Primary,
  },
  tint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(12, 16, 28, 0.42)',
  },
  inner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 8,
  },
  accent: {
    alignSelf: 'stretch',
    borderRadius: 2,
    marginVertical: 2,
  },
  label: {
    flex: 1,
    color: COLORS.Content,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  lockBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
});

export default memo(AffirmationCategoryChip);
