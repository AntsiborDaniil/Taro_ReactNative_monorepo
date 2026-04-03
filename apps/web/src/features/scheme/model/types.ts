import { ComponentType } from 'react';
import { LayoutChangeEvent, ViewStyle } from 'react-native';
import { StyleProp } from 'react-native/Libraries/StyleSheet/StyleSheet';
import { SpreadName } from 'shared/api';

export type TCardSchemeProps = {
  hasRotation?: boolean;
  style?: StyleProp<ViewStyle>;
  onLayout?: (index: number) => (event: LayoutChangeEvent) => void;
};

export type TSchemeMapping = {
  [key in SpreadName]?: ComponentType<TCardSchemeProps>;
};
