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

export const InputSlider = ({
  label,
  maxValue,
  minValue,
  step,
  value,
  onChange,
  color,
}: Props) => {
  const accentColor = color ?? COLORS.Primary;
  const displayValue = value % 1 === 0 ? String(value) : value.toFixed(1);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text
          category={TEXT_TAGS.label}
          weight={TEXT_WEIGHT.medium}
          style={styles.label}
        >
          {label}
        </Text>
        <View style={[styles.badge, { borderColor: accentColor + '40' }]}>
          <Text
            category={TEXT_TAGS.label}
            weight={TEXT_WEIGHT.bold}
            style={[styles.badgeText, { color: accentColor }]}
          >
            {displayValue}
          </Text>
        </View>
      </View>
      <View style={styles.track}>
        <Slider
          onResponderGrant={() => Platform.select({ android: true, ios: false })}
          style={styles.slider}
          minimumValue={minValue}
          maximumValue={maxValue}
          maximumTrackTintColor={COLORS.SpbSky2}
          minimumTrackTintColor={accentColor}
          thumbTintColor={accentColor}
          step={step}
          value={value}
          onValueChange={onChange}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.Background2,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(119,127,133,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    color: COLORS.Content,
    flex: 1,
  },
  badge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    minWidth: 44,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 13,
  },
  track: {
    width: '100%',
    justifyContent: 'center',
  },
  slider: {
    width: '100%',
    height: 36,
  },
});
