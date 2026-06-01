import { Dimensions, Platform } from 'react-native';
import Device from 'react-native-device-detection';

const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

function readWindowSize(): { width: number; height: number } {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return {
      width: window.innerWidth > 0 ? window.innerWidth : BASE_WIDTH,
      height: window.innerHeight > 0 ? window.innerHeight : BASE_HEIGHT,
    };
  }

  const { width, height } = Dimensions.get('window');
  return {
    width: width > 0 ? width : BASE_WIDTH,
    height: height > 0 ? height : BASE_HEIGHT,
  };
}

/** @deprecated Prefer getWindowWidth() — kept for typography tier init. */
export const { width, height } = readWindowSize();

export function getWindowWidth(): number {
  return readWindowSize().width;
}

export function getWindowHeight(): number {
  return readWindowSize().height;
}

export const isTablet = Boolean(Device?.isTablet);

export const horizontalScale = (size: number): number =>
  (getWindowWidth() / BASE_WIDTH) * size;

export const verticalScale = (size: number): number =>
  (getWindowHeight() / BASE_HEIGHT) * size;

/** Один общий коэффициент масштаба текста; кегли задаются в `shared/themes/typography.ts`. */
export const moderateScale = (size: number, factor = 0.42): number =>
  size + (horizontalScale(size) - size) * factor;
