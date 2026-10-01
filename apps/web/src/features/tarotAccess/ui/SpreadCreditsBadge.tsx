import { StyleSheet, View } from 'react-native';
import { Infinity as InfinityIcon, LightningBolt } from 'shared/icons';
import { DS_COLORS, DS_SIZES } from 'shared/themes/ds';
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
 * Индикатор квоты расклада (шапка, настройки) по DS:
 * круглая плашка ground700 с ободком accent400, молния всегда accent400,
 * счётчик — ground800 + кант accent400 + ink50, «+» — метка accent400 с тёмным знаком.
 * Режимы различаются только числом/∞, без свечения и теней.
 */
export function SpreadCreditsBadge({
  mode,
  remaining = 0,
  size = 28,
  showTopUpHint = false,
}: SpreadCreditsBadgeProps) {
  const boltColor = DS_COLORS.accent400;
  const accentBorder = DS_COLORS.accent400;
  const accentText = DS_COLORS.ink50;

  const count = Math.max(0, Math.floor(remaining));
  const countLabel =
    mode === 'unlimited' ? '∞' : count > 99 ? '99+' : String(count);
  const showPlus = showTopUpHint && mode !== 'unlimited';
  const label = showPlus ? `${countLabel} +` : countLabel;

  const rootSize = Math.max(30, Math.round(size * 1.7));
  const badgeMin = size <= 18 ? 14 : 16;
  const badgeFont = size <= 18 ? 9 : 10;
  const iconSize = Math.round(size * 0.9);

  return (
    <View
      style={[
        styles.root,
        { width: rootSize, height: rootSize, borderRadius: rootSize / 2 },
        mode === 'unlimited' && styles.rootWide,
      ]}
      accessibilityRole="text"
      accessibilityLabel={label}
    >
      <View style={styles.boltRow}>
        <LightningBolt width={iconSize} height={iconSize} fill={boltColor} />
        {mode === 'unlimited' ? (
          <InfinityIcon
            width={Math.round(size * 0.72)}
            height={Math.round(size * 0.72)}
            fill={boltColor}
          />
        ) : null}
      </View>
      {showPlus ? (
        <View
          style={[
            styles.badge,
            styles.plusBadge,
            {
              borderColor: accentBorder,
              width: badgeMin,
              height: badgeMin,
              borderRadius: badgeMin / 2,
            },
          ]}
        >
          <Text
            category={TEXT_TAGS.label}
            weight={TEXT_WEIGHT.extraBold}
            style={[
              styles.badgeText,
              {
                color: DS_COLORS.onAction,
                fontSize: badgeFont + 1,
                lineHeight: badgeFont + 3,
              },
            ]}
          >
            +
          </Text>
        </View>
      ) : null}
      {mode !== 'unlimited' ? (
        <View
          style={[
            styles.badge,
            styles.countBadge,
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
            {countLabel}
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
    backgroundColor: DS_COLORS.ground700,
    borderWidth: DS_SIZES.edgeWidth,
    borderColor: DS_COLORS.accent400,
  },
  rootWide: {
    minWidth: 40,
    paddingHorizontal: 6,
  },
  boltRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  badge: {
    position: 'absolute',
    bottom: -1,
    paddingHorizontal: 3,
    backgroundColor: DS_COLORS.ground800,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusBadge: {
    right: -4,
    bottom: -4,
    paddingHorizontal: 0,
    backgroundColor: DS_COLORS.accent400,
  },
  countBadge: {
    left: -4,
    bottom: -4,
  },
  badgeText: {
    fontSize: 10,
    lineHeight: 12,
  },
});
