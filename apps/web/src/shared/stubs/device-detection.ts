import { Platform } from 'react-native';

function getWebWidth(): number {
  if (typeof window !== 'undefined') {
    return window.innerWidth;
  }
  return 375;
}

/** Web-safe replacement for react-native-device-detection (metro alias). */
const Device = {
  isTablet:
    Platform.OS === 'web'
      ? getWebWidth() >= 768
      : false,
  isPhone: true,
};

export default Device;
