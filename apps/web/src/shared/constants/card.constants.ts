import { Platform } from 'react-native';
import { horizontalScale, isTablet, verticalScale } from 'shared/lib';
import { TSchemeCardSize } from '../types';

export const SCHEME_CARD_SIZE: TSchemeCardSize = {
  width: isTablet ? horizontalScale(36) : horizontalScale(53),
  height: verticalScale(94),
};

// On web horizontalScale(53) ≈ 61px CSS — too small for comfortable use.
// Use a fixed size that looks good in a browser while keeping native behaviour.
export const SLIDER_CARD_SIZE: TSchemeCardSize =
  Platform.OS === 'web'
    ? { width: 110, height: 180 }
    : {
        width: isTablet ? horizontalScale(36) : horizontalScale(53),
        height: verticalScale(94),
      };
