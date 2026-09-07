import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Infinity as InfinityIcon, LightningBolt } from 'shared/icons';
import { COLORS, getColorOpacity } from 'shared/themes';
import { Text, TEXT_TAGS, TEXT_WEIGHT } from 'shared/ui/Text';

export type SpreadQuotaBadgeMode = 'daily' | 'credits' | 'unlimited';

type SpreadCreditsBadgeProps = {
  mode: SpreadQuotaBadgeMode;
  /** Remaining free daily spreads or paid credits. Ignored for unlimited. */
  remaining?: number;
  size?: number;
};

/**
 * Settings header quota indicator:
 * - daily (no pack): gray bolt + remaining free spreads
 * - credits (paid pack): yellow bolt + remaining charges
 * - unlimited (monthly etc.): yellow bolt + infinity
 */
export function SpreadCreditsBadge({
  mode,
  remaining = 0,
  size = 28,
}: SpreadCreditsBadgeProps) {
  const isCharged = mode === 'credits' || mode === 'unlimited';
  const boltColor = isCharged ? COLORS.Primary500 : COLORS.SpbSky2;
  const accentBorder = isCharged
    ? getColorOpacity(COLORS.Primary500, 70)
    : getColorOpacity(COLORS.SpbSky1, 55);
  const accentText = isCharged ? COLORS.Primary500 : COLORS.SpbSky1;
  const glowColor = isCharged
    ? getColorOpacity(COLORS.Primary500, 28)
    : getColorOpacity(COLORS.SpbSky2, 22);

  const pulse = useSharedValue(1);
  const glow = useSharedValue(isCharged ? 0.35 : 0.22);
  const tilt = useSharedValue(0);

  useEffect(() => {
    const pulseHi = isCharged ? 1.16 : 1.08;
    const glowHi = isCharged ? 0.82 : 0.42;
    const glowLo = isCharged ? 0.28 : 0.16;

    pulse.value = withRepeat(
      withSequence(
        withTiming(pulseHi, {
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(1, {
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
        })
      ),
      -1,
      false
    );
    glow.value = withRepeat(
      withSequence(
        withTiming(glowHi, {
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(glowLo, {
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
        })
      ),
      -1,
      false
    );
    tilt.value = withRepeat(
      withSequence(
        withTiming(isCharged ? -8 : -4, {
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(isCharged ? 8 : 4, {
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(0, {
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
        })
      ),
      -1,
      false
    );
  }, [glow, isCharged, pulse, tilt]);

  const boltStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }, { rotate: `${tilt.value}deg` }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scale: 0.8 + glow.value * 0.45 }],
  }));

  const count = Math.max(0, Math.floor(remaining));
  const label =
    mode === 'unlimited' ? '∞' : count > 99 ? '99+' : String(count);

  return (
    <View
      style={[styles.root, mode === 'unlimited' && styles.rootWide]}
      accessibilityRole="text"
      accessibilityLabel={label}
    >
      <Animated.View
        style={[
          styles.glow,
          {
            width: size * 1.85,
            height: size * 1.85,
            borderRadius: size,
            backgroundColor: glowColor,
          },
          glowStyle,
        ]}
      />
      <Animated.View style={[styles.boltRow, boltStyle]}>
        <LightningBolt width={size} height={size} fill={boltColor} />
        {mode === 'unlimited' ? (
          <InfinityIcon
            width={Math.round(size * 0.72)}
            height={Math.round(size * 0.72)}
            fill={boltColor}
          />
        ) : null}
      </Animated.View>
      {mode !== 'unlimited' ? (
        <View style={[styles.badge, { borderColor: accentBorder }]}>
          <Text
            category={TEXT_TAGS.label}
            weight={TEXT_WEIGHT.bold}
            style={[styles.badgeText, { color: accentText }]}
          >
            {label}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rootWide: {
    width: 56,
  },
  glow: {
    position: 'absolute',
  },
  boltRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  badge: {
    position: 'absolute',
    right: 0,
    bottom: 2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: COLORS.Background2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 11,
    lineHeight: 13,
  },
});
