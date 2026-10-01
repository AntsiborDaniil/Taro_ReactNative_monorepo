import { memo } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
  type PressableStateCallbackType,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { LockIcon } from 'shared/icons';
import { DS_COLORS, dsRadius, dsWebTransition } from 'shared/themes/ds';
import { Text, TEXT_TAGS, TEXT_WEIGHT } from 'shared/ui';

type AffirmationCategoryChipProps = {
  labelKey: string;
  width: number;
  height: number;
  fontSize: number;
  isSelected: boolean;
  isLocked: boolean;
  onPress: () => void;
};

/** Плашка-категория DS: тихая ground700/ground600, выбранная — calm600 + кант accent400. */
function AffirmationCategoryChip({
  labelKey,
  width,
  height,
  fontSize,
  isSelected,
  isLocked,
  onPress,
}: AffirmationCategoryChipProps) {
  const { t } = useTranslation();

  const pressableStyle = ({
    hovered,
    pressed,
  }: PressableStateCallbackType & { hovered?: boolean }) => [
    styles.chip,
    {
      width,
      height,
      borderRadius: dsRadius.plate(height),
    },
    isSelected && styles.chipSelected,
    hovered && styles.chipHovered,
    pressed && styles.chipPressed,
  ];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t(labelKey)}
      accessibilityState={{ selected: isSelected, disabled: false }}
      onPress={onPress}
      style={pressableStyle}
    >
      <View style={styles.inner}>
        <Text
          category={TEXT_TAGS.p2}
          weight={isSelected ? TEXT_WEIGHT.medium : TEXT_WEIGHT.regular}
          numberOfLines={2}
          ellipsizeMode="tail"
          style={[
            styles.label,
            isSelected && styles.labelSelected,
            { fontSize, lineHeight: Math.round(fontSize * 1.25) },
          ]}
        >
          {t(labelKey)}
        </Text>
        {isLocked ? (
          <View style={styles.lockBadge}>
            <LockIcon width={14} height={14} fill={DS_COLORS.ink100} />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1,
    borderColor: DS_COLORS.ground600,
    backgroundColor: DS_COLORS.ground700,
    ...dsWebTransition,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : {}),
  },
  chipSelected: {
    backgroundColor: DS_COLORS.calm600,
    borderColor: DS_COLORS.accent400,
  },
  chipHovered: {
    backgroundColor: DS_COLORS.pressDim,
  },
  chipPressed: Platform.select({
    web: { transform: [{ translateY: 1 }] } as object,
    default: { transform: [{ translateY: 1 }], opacity: 0.9 },
  }),
  inner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
  },
  label: {
    flex: 1,
    color: DS_COLORS.ink50,
  },
  labelSelected: {
    color: DS_COLORS.ink50,
  },
  lockBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: DS_COLORS.ground600,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default memo(AffirmationCategoryChip);
