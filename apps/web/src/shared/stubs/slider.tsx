/**
 * Web stub for @react-native-community/slider.
 * Renders a native HTML <input type="range"> styled to match the app design.
 * The global CSS in App.tsx handles the deep track/thumb styling.
 */
import React, { useEffect, useRef } from 'react';

type SliderProps = {
  minimumValue?: number;
  maximumValue?: number;
  step?: number;
  value?: number;
  onValueChange?: (value: number) => void;
  minimumTrackTintColor?: string;
  maximumTrackTintColor?: string;
  thumbTintColor?: string;
  style?: React.CSSProperties & { width?: any; height?: any };
  [key: string]: unknown;
};

export default function Slider({
  minimumValue = 0,
  maximumValue = 100,
  step = 1,
  value = 0,
  onValueChange,
  minimumTrackTintColor = '#F6C01B',
  maximumTrackTintColor = '#333A43',
  style,
}: SliderProps) {
  const ref = useRef<HTMLInputElement>(null);

  // Update the CSS custom property that drives the filled-track gradient on WebKit
  const updateFill = (val: number) => {
    if (!ref.current) return;
    const pct = ((val - minimumValue) / (maximumValue - minimumValue)) * 100;
    ref.current.style.setProperty('--fill', `${pct}%`);
    ref.current.style.setProperty('--track-fill', minimumTrackTintColor);
    ref.current.style.setProperty('--track-bg', maximumTrackTintColor);
  };

  useEffect(() => {
    updateFill(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, minimumValue, maximumValue, minimumTrackTintColor]);

  return (
    <input
      ref={ref}
      type="range"
      min={minimumValue}
      max={maximumValue}
      step={step}
      defaultValue={value}
      className="tarot-range"
      onChange={(e) => {
        const v = Number(e.target.value);
        updateFill(v);
        onValueChange?.(v);
      }}
      style={{
        flex: 1,
        height: 4,
        ...(style as React.CSSProperties),
      }}
    />
  );
}
