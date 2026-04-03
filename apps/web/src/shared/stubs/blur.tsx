import React from 'react';
import { View, ViewProps } from 'react-native';

type BlurViewProps = ViewProps & {
  blurType?: string;
  blurAmount?: number;
  reducedTransparencyFallbackColor?: string;
};

export const BlurView: React.FC<BlurViewProps> = ({ style, children }) => (
  <View style={style}>{children}</View>
);
