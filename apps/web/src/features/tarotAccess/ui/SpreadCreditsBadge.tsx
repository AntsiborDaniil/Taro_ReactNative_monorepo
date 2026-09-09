import { Platform, StyleSheet, View } from 'react-native';
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
 * - daily: muted bolt + remaining free spreads
 * - credits / unlimited: static dark-gold glow (no pulse)
 */
export function SpreadCreditsBadge({
  mode,
  remaining = 0,
  size = 28,
}: SpreadCreditsBadgeProps) {
  const isCharged = mode === 'credits' || mode === 'unlimited';
  const boltColor = isCharged ? COLORS.Primary600 : COLORS.SpbSky2;
  const accentBorder = isCharged
    ? getColorOpacity(COLORS.Primary600, 75)
    : getColorOpacity(COLORS.SpbSky1, 55);
  const accentText = isCharged ? COLORS.Primary500 : COLORS.SpbSky1;

  const count = Math.max(0, Math.floor(remaining));
  const label =
    mode === 'unlimited' ? '∞' : count > 99 ? '99+' : String(count);

  return (
    <View
      style={[styles.root, mode === 'unlimited' && styles.rootWide]}
      accessibilityRole="text"
      accessibilityLabel={label}
    >
      {isCharged ? (
        <View
          style={[
            styles.glow,
            {
              width: size * 1.9,
              height: size * 1.9,
              borderRadius: size,
            },
          ]}
        />
      ) : null}
      <View style={styles.boltRow}>
        <LightningBolt width={size} height={size} fill={boltColor} />
        {mode === 'unlimited' ? (
          <InfinityIcon
            width={Math.round(size * 0.72)}
            height={Math.round(size * 0.72)}
            fill={boltColor}
          />
        ) : null}
      </View>
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
    backgroundColor: getColorOpacity(COLORS.Primary700, 42),
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: `0 0 18px ${getColorOpacity(COLORS.Primary600, 55)}, 0 0 8px ${getColorOpacity(COLORS.Primary800, 65)}`,
        } as object)
      : {
          shadowColor: COLORS.Primary700,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.7,
          shadowRadius: 10,
          elevation: 6,
        }),
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
