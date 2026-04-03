import React from 'react';
import { View } from 'react-native';

export type TooltipProps = {
  isVisible?: boolean;
  content?: React.ReactNode;
  placement?: string;
  onClose?: () => void;
  contentStyle?: object;
  arrowSize?: { width: number; height: number };
  children?: React.ReactNode;
  [key: string]: unknown;
};

const Tooltip: React.FC<TooltipProps> = ({ children }) => (
  <View>{children}</View>
);

export default Tooltip;
