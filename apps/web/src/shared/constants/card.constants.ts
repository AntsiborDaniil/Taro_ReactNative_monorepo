import { horizontalScale, isTablet, verticalScale } from 'shared/lib';
import { TSchemeCardSize } from '../types';

export const SCHEME_CARD_SIZE: TSchemeCardSize = {
  width: isTablet ? horizontalScale(36) : horizontalScale(53),
  height: verticalScale(94),
};

export const SLIDER_CARD_SIZE: TSchemeCardSize = {
  width: isTablet ? horizontalScale(36) : horizontalScale(53),
  height: verticalScale(94),
};
