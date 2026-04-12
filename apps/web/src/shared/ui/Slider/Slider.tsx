import * as React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { Text, TEXT_TAGS, TEXT_WEIGHT } from '../Text';
import { COLORS } from '../../themes';

type Props = {
  label: string;
  value: number;
  minValue: number;
  maxValue: number;
  step: number;
  color?: string;
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
}: Props) {
  const [hovered, setHovered] = React.useState(false);

  const display =
    String(value % 1 === 0 ? value : value.toFixed(1));

  return (
    <View
      style={[styles.card, hovered && styles.cardHover]}
      {...(Platform.OS === 'web'
        ? {
            onPointerEnter: () => setHovered(true),
            onPointerLeave: () => setHovered(false),
          }
        : {})}
    >
      <Text
        category={TEXT_TAGS.h5}
        weight={TEXT_WEIGHT.semibold}
        style={styles.label}
      >
        {label}
      </Text>
      <View style={styles.row}>
        <Slider
          onResponderGrant={() =>
            Platform.select({ android: true, ios: false })
          }
          style={styles.slider}
          minimumValue={minValue}
          maximumValue={maxValue}
          maximumTrackTintColor={COLORS.SpbSky2}
          minimumTrackTintColor={color ?? COLORS.Primary}
          thumbTintColor={color ?? COLORS.Primary}
          step={step}
          value={value}
          onValueChange={onChange}
        />
        <Text
          category={TEXT_TAGS.h5}
          weight={TEXT_WEIGHT.semibold}
          style={styles.value}
        >
          {display}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 14,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardHover:
    Platform.OS === 'web'
      ? ({
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          borderColor: 'rgba(255, 255, 255, 0.16)',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.28)',
        } as object)
      : {},
  label: {
    marginBottom: 14,
    color: COLORS.Content,
    letterSpacing: 0.2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  slider: {
    flex: 1,
    height: 44,
  },
  value: {
    minWidth: 36,
    textAlign: 'right',
    color: COLORS.Content,
  },
});
