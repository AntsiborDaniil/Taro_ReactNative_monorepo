import * as React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { Text, TEXT_TAGS, TEXT_WEIGHT } from '../Text';
import { WEB_HOVER_TRANSITION } from 'shared/lib';
import { COLORS, getColorOpacity } from '../../themes';

type Props = {
  label: string;
  value: number;
  minValue: number;
  maxValue: number;
  step: number;
  color?: string;
  /** Подсказка под названием: что значат края шкалы. */
  hint?: string;
  /** Значение ещё не выставлено — вместо нуля показываем прочерк. */
  unset?: boolean;
  onChange(value: number): void;
};

export function InputSlider({
  label,
  maxValue,
  minValue,
  step,
  value,
  onChange,
  color,
  hint,
  unset = false,
}: Props) {
  const [hovered, setHovered] = React.useState(false);

  const accent = color ?? COLORS.Primary;

  const display = unset
    ? '—'
    : String(value % 1 === 0 ? value : value.toFixed(1));

  return (
    <View
      style={[
        styles.card,
        { borderColor: getColorOpacity(accent, hovered ? 46 : 26) },
        hovered && styles.cardHover,
      ]}
      {...(Platform.OS === 'web'
        ? {
            onPointerEnter: () => setHovered(true),
            onPointerLeave: () => setHovered(false),
          }
        : {})}
    >
      <View style={[styles.accent, { backgroundColor: accent }]} />

      <View style={styles.head}>
        <View style={styles.titleCol}>
          <View style={styles.labelRow}>
            <View style={[styles.dot, { backgroundColor: accent }]} />
            <Text
              category={TEXT_TAGS.h5}
              weight={TEXT_WEIGHT.semibold}
              style={styles.label}
            >
              {label}
            </Text>
          </View>
          {!!hint && (
            <Text category={TEXT_TAGS.label} style={styles.hint}>
              {hint}
            </Text>
          )}
        </View>

        <View
          style={[
            styles.valuePill,
            {
              borderColor: getColorOpacity(accent, 48),
              backgroundColor: getColorOpacity(accent, 16),
            },
          ]}
        >
          <Text
            category={TEXT_TAGS.h5}
            weight={TEXT_WEIGHT.bold}
            style={[
              styles.value,
              { color: unset ? COLORS.SpbSky1 : accent },
            ]}
          >
            {display}
          </Text>
          <Text category={TEXT_TAGS.label} style={styles.valueScale}>
            {`/ ${maxValue}`}
          </Text>
        </View>
      </View>

      <Slider
        style={styles.slider}
        accessibilityLabel={label}
        minimumValue={minValue}
        maximumValue={maxValue}
        maximumTrackTintColor={COLORS.SpbSky2}
        minimumTrackTintColor={accent}
        thumbTintColor={accent}
        step={step}
        value={value}
        onValueChange={onChange}
      />

      <View style={styles.scaleRow}>
        <Text category={TEXT_TAGS.label} style={styles.scaleEdge}>
          {String(minValue)}
        </Text>
        <Text category={TEXT_TAGS.label} style={styles.scaleEdge}>
          {String(maxValue)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingTop: 16,
    paddingBottom: 8,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.045)',
    borderWidth: 1,
    overflow: 'hidden',
    ...WEB_HOVER_TRANSITION,
  },
  cardHover:
    Platform.OS === 'web'
      ? ({
          backgroundColor: 'rgba(255, 255, 255, 0.075)',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.28)',
        } as object)
      : {},
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  label: {
    color: COLORS.Content,
    letterSpacing: 0.2,
  },
  hint: {
    color: getColorOpacity(COLORS.Content, 55),
    lineHeight: 16,
  },
  valuePill: {
    minWidth: 62,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  value: {
    fontSize: 18,
    lineHeight: 22,
  },
  valueScale: {
    color: getColorOpacity(COLORS.Content, 45),
  },
  slider: {
    width: '100%',
    height: 40,
    marginTop: 6,
  },
  scaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  scaleEdge: {
    color: getColorOpacity(COLORS.Content, 38),
  },
});
