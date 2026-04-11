import React from 'react';
import { Platform, StyleSheet } from 'react-native';

type SliderProps = {
  value?: number;
  minimumValue?: number;
  maximumValue?: number;
  step?: number;
  style?: any;
  onValueChange?: (value: number) => void;
  minimumTrackTintColor?: string;
  maximumTrackTintColor?: string;
  thumbTintColor?: string;
};

export default function Slider({
  value = 0,
  minimumValue = 0,
  maximumValue = 100,
  step = 1,
  style,
  onValueChange,
  minimumTrackTintColor,
  maximumTrackTintColor,
}: SliderProps) {
  const flattenedStyle = StyleSheet.flatten(style) ?? {};

  return (
    <input
      type="range"
      min={minimumValue}
      max={maximumValue}
      step={step}
      value={value}
      onChange={(event) => onValueChange?.(Number(event.target.value))}
      style={{
        width: '100%',
        accentColor: minimumTrackTintColor,
        backgroundColor: maximumTrackTintColor,
        ...flattenedStyle,
        ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
      }}
    />
  );
}
