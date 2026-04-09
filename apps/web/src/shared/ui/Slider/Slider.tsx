import * as React from 'react';
import { Platform, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { Text } from '../Text';
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
}: Props) => (
  <View style={{ marginVertical: 10 }}>
    <Text style={{ fontWeight: 'bold' }}>{label}</Text>
    <View
      style={{
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
      }}
    >
      <Slider
        onResponderGrant={() => Platform.select({ android: true, ios: false })}
        style={{ width: '90%', height: 40 }}
        minimumValue={minValue}
        maximumValue={maxValue}
        maximumTrackTintColor={COLORS.SpbSky2}
        minimumTrackTintColor={color ?? COLORS.Primary}
        thumbTintColor={color ?? COLORS.Primary}
        step={step}
        value={value}
        onValueChange={onChange}
      />
      <Text style={{ alignSelf: 'center' }}>
        {String(value % 1 === 0 ? value : value.toFixed(1))}
      </Text>
    </View>
  </View>
);
