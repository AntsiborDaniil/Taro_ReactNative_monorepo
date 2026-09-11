import { ReactElement, useEffect } from 'react';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import type { TMoodItem } from 'shared/api';
import { COLORS, getColorOpacity } from 'shared/themes';
import { Text, TEXT_TAGS, TEXT_WEIGHT } from 'shared/ui/Text';

const METRICS: Array<{
  key: keyof Pick<TMoodItem, 'mood' | 'energy' | 'stress'>;
  color: string;
  delayMs: number;
}> = [
  { key: 'mood', color: '#2658B7', delayMs: 0 },
  { key: 'energy', color: '#50A622', delayMs: 180 },
  { key: 'stress', color: '#AC2224', delayMs: 360 },
];

type MoodMetricBoxesProps = {
  values: Pick<TMoodItem, 'mood' | 'energy' | 'stress'>;
};

function FloatingBox({
  label,
  value,
  color,
  delayMs,
  compact,
}: {
  label: string;
  value: number;
  color: string;
  delayMs: number;
  compact: boolean;
}) {
  const float = useSharedValue(0);

  useEffect(() => {
    float.value = withDelay(
      delayMs,
      withRepeat(
        withSequence(
          withTiming(-6, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
          withTiming(6, { duration: 1400, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );
  }, [delayMs, float]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: float.value }],
  }));

  const display = Number.isFinite(value) ? Math.round(value) : 0;

  return (
    <Animated.View
      style={[
        styles.box,
        compact && styles.boxCompact,
        {
          borderColor: getColorOpacity(color, 55),
          backgroundColor: getColorOpacity(color, 18),
        },
        animatedStyle,
      ]}
    >
      <View style={[styles.accent, { backgroundColor: color }]} />
      <Text
        category={TEXT_TAGS.label}
        weight={TEXT_WEIGHT.semibold}
        style={styles.label}
        numberOfLines={1}
      >
        {label}
      </Text>
      <Text
        category={TEXT_TAGS.h3}
        weight={TEXT_WEIGHT.bold}
        style={[styles.value, { color }]}
      >
        {display}
      </Text>
      <Text category={TEXT_TAGS.label} style={styles.scale}>
        / 10
      </Text>
    </Animated.View>
  );
}

export function MoodMetricBoxes({ values }: MoodMetricBoxesProps): ReactElement {
  const { t } = useTranslation('moodAndEnergy');
  const { width } = useWindowDimensions();
  const compact = width < 520;

  return (
    <View style={[styles.row, compact && styles.rowCompact]}>
      {METRICS.map((metric) => (
        <FloatingBox
          key={metric.key}
          label={t(`name.${metric.key}`)}
          value={values[metric.key] ?? 0}
          color={metric.color}
          delayMs={metric.delayMs}
          compact={compact}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 12,
  },
  rowCompact: {
    flexDirection: 'column',
  },
  box: {
    flex: 1,
    minHeight: 112,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    overflow: 'hidden',
    justifyContent: 'center',
    gap: 2,
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 10px 24px rgba(0, 0, 0, 0.18)',
        } as object)
      : {
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 6 },
          elevation: 4,
        }),
  },
  boxCompact: {
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  label: {
    color: COLORS.Content,
    opacity: 0.88,
    letterSpacing: 0.2,
  },
  value: {
    fontSize: 32,
    lineHeight: 38,
  },
  scale: {
    color: getColorOpacity(COLORS.Content, 48),
  },
});
