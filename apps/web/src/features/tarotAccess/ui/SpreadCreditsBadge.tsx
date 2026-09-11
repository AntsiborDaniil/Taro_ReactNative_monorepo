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
  /** Показать «+» в бейдже снизу справа (пополнение). */
  showTopUpHint?: boolean;
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
  showTopUpHint = false,
}: SpreadCreditsBadgeProps) {
  const isCharged = mode === 'credits' || mode === 'unlimited';
  const boltColor = isCharged ? COLORS.Primary600 : COLORS.SpbSky2;
  const accentBorder = isCharged
    ? getColorOpacity(COLORS.Primary600, 75)
    : getColorOpacity(COLORS.SpbSky1, 55);
  const accentText = isCharged ? COLORS.Primary500 : COLORS.SpbSky1;

  const count = Math.max(0, Math.floor(remaining));
  const countLabel =
    mode === 'unlimited' ? '∞' : count > 99 ? '99+' : String(count);
  const label =
    showTopUpHint && mode !== 'unlimited' && count <= 99
      ? `${countLabel}+`
      : countLabel;

  const rootSize = Math.max(28, Math.round(size * 1.55));
  const badgeMin = size <= 18 ? 14 : 16;
  const badgeFont = size <= 18 ? 9 : 10;

  return (
    <View
      style={[
        styles.root,
        { width: rootSize, height: rootSize },
        mode === 'unlimited' && styles.rootWide,
      ]}
      accessibilityRole="text"
      accessibilityLabel={label}
    >
      {isCharged ? (
        <View
          style={[
            styles.glow,
            {
              // Keep glow tight around the bolt (−4px vs previous diameter).
              width: Math.max(size, size * 1.85 - 4),
              height: Math.max(size, size * 1.85 - 4),
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
        <View
          style={[
            styles.badge,
            {
              borderColor: accentBorder,
              minWidth: badgeMin,
              height: badgeMin,
              borderRadius: badgeMin / 2,
            },
          ]}
        >
          <Text
            category={TEXT_TAGS.label}
            weight={TEXT_WEIGHT.bold}
            style={[
              styles.badgeText,
              { color: accentText, fontSize: badgeFont, lineHeight: badgeFont + 2 },
            ]}
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  rootWide: {
    minWidth: 40,
  },
  glow: {
    position: 'absolute',
    backgroundColor: getColorOpacity(COLORS.Primary700, 38),
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: `0 0 8px ${getColorOpacity(COLORS.Primary600, 45)}, 0 0 3px ${getColorOpacity(COLORS.Primary800, 55)}`,
        } as object)
      : {
          shadowColor: COLORS.Primary700,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.55,
          shadowRadius: 4,
          elevation: 4,
        }),
  },
  boltRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  badge: {
    position: 'absolute',
    right: -1,
    bottom: 0,
    paddingHorizontal: 3,
    backgroundColor: COLORS.Background2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 10,
    lineHeight: 12,
  },
});
