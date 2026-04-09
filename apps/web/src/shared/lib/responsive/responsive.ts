import { Dimensions } from 'react-native';
import Device from 'react-native-device-detection';

export const { width, height } = Dimensions.get('window');

const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

export const isTablet = Device.isTablet;

export const horizontalScale = (size: number) => (width / BASE_WIDTH) * size;

export const verticalScale = (size: number) => (height / BASE_HEIGHT) * size;

export const moderateScale = (size: number, factor = 0.5) =>
  size + (horizontalScale(size) - size) * factor;
