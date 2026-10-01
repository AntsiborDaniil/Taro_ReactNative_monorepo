import { type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';
import { DS_COLORS } from 'shared/themes/ds';
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
    borderColor: DS_COLORS.ground600,
    backgroundColor: DS_COLORS.ground700,
    flexShrink: 0,
  },
  stepBadgeText: {
    color: DS_COLORS.accent400,
    fontSize: 13,
    lineHeight: 16,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  title: {
    color: DS_COLORS.ink50,
    letterSpacing: 0.2,
  },
  hint: {
    color: DS_COLORS.ink100,
    lineHeight: 16,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: DS_COLORS.ground600,
    backgroundColor: DS_COLORS.ground700,
    flexShrink: 0,
  },
  badgeText: {
    color: DS_COLORS.ink100,
  },
});

export default MoodStepHeader;
