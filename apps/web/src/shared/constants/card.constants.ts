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

/** Full-size card while flying from carousel to scheme (matches CoverFlow carousel). */
export function getFlyingCardSize(screenWidth: number): TSchemeCardSize {
  const carouselWidth = Math.max(200, Math.min(360, screenWidth - 56));
  const width = Math.round(Math.max(150, carouselWidth * 0.62));
  const height = Math.round(width * 1.8);
  return { width, height };
}

/** @deprecated Use getFlyingCardSize — kept for imports that expect a constant name. */
export const SLIDER_CARD_SIZE: TSchemeCardSize = getFlyingCardSize(390);
