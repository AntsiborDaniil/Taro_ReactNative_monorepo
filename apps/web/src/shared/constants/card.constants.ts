import {
  horizontalScale,
  isTablet,
  verticalScale,
} from 'shared/lib/responsive/responsive';
import { TSchemeCardSize } from '../types';

function buildCardSize(): TSchemeCardSize {
  return {
    width: isTablet ? horizontalScale(36) : horizontalScale(53),
    height: verticalScale(94),
  };
}

export const SCHEME_CARD_SIZE: TSchemeCardSize = buildCardSize();

export const SLIDER_CARD_SIZE: TSchemeCardSize = buildCardSize();
