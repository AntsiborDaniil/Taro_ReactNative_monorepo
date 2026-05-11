/**
 * React 19 + @types/react: JSX host types expect `new (props) => Component`.
 * RN declares `View` / `ImageBackground` as `Constructor<NativeMethods> & typeof ViewComponent`,
 * which fails that check. Cast to ComponentType for web TSX.
 */
import type { ComponentType } from 'react';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import type { LinearGradientProps } from 'expo-linear-gradient/build/LinearGradient';
import {
  ImageBackground as RNImageBackground,
  View as RNView,
} from 'react-native';
import type { ImageBackgroundProps, ViewProps } from 'react-native';

export const View = RNView as unknown as ComponentType<ViewProps>;
export const ImageBackground =
  RNImageBackground as unknown as ComponentType<ImageBackgroundProps>;
export const LinearGradient =
  ExpoLinearGradient as unknown as ComponentType<LinearGradientProps>;
