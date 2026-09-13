import { type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';
import { COLORS, getColorOpacity } from 'shared/themes';
import { Text, TEXT_TAGS, TEXT_WEIGHT } from 'shared/ui';

export type MoodStepHeaderProps = {
  /** Номер шага — подсказывает порядок действий на странице. */
  step: number;
  title: string;
  hint?: string;
  /** Счётчик справа, например «2 из 3». */
  badge?: string;
};

function MoodStepHeader({
  step,
  title,
  hint,
  badge,
}: MoodStepHeaderProps): ReactElement {
  return (
    <View style={styles.row}>
      <View style={styles.stepBadge}>
        <Text
          category={TEXT_TAGS.label}
          weight={TEXT_WEIGHT.bold}
          style={styles.stepBadgeText}
        >
          {String(step)}
        </Text>
      </View>

      <View style={styles.textCol}>
        <Text
          category={TEXT_TAGS.h5}
          weight={TEXT_WEIGHT.semibold}
          style={styles.title}
        >
          {title}
        </Text>
        {!!hint && (
          <Text category={TEXT_TAGS.label} style={styles.hint}>
            {hint}
          </Text>
        )}
      </View>

      {!!badge && (
        <View style={styles.badge}>
          <Text
            category={TEXT_TAGS.label}
            weight={TEXT_WEIGHT.semibold}
            style={styles.badgeText}
          >
            {badge}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 2,
  },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: getColorOpacity(COLORS.Primary, 42),
    backgroundColor: getColorOpacity(COLORS.Primary, 14),
    flexShrink: 0,
  },
  stepBadgeText: {
    color: COLORS.Primary,
    fontSize: 13,
    lineHeight: 16,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  title: {
    color: COLORS.Content,
    letterSpacing: 0.2,
  },
  hint: {
    color: getColorOpacity(COLORS.Content, 58),
    lineHeight: 16,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(132, 176, 230, 0.26)',
    backgroundColor: 'rgba(132, 176, 230, 0.1)',
    flexShrink: 0,
  },
  badgeText: {
    color: 'rgba(216, 228, 247, 0.9)',
  },
});

export default MoodStepHeader;
