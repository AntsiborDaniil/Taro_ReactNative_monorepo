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

/** CoverFlow carousel card size (slider — do not shrink). */
export function getCarouselCardSize(screenWidth: number): TSchemeCardSize {
  const carouselWidth = Math.max(200, Math.min(360, screenWidth - 56));
  const width = Math.round(Math.max(150, carouselWidth * 0.62));
  const height = Math.round(width * 1.8);
  return { width, height };
}

/**
 * Small preview card shown next to the slider after tap (before flying to scheme).
 * Scales with screen size but stays clearly smaller than the carousel card.
 */
export function getFlyingCardSize(screenWidth: number): TSchemeCardSize {
  const slider = getCarouselCardSize(screenWidth);

  const scale =
    screenWidth < 360 ? 0.38 : screenWidth < 420 ? 0.4 : screenWidth >= 900 ? 0.34 : 0.42;

  const width = Math.round(
    Math.max(52, Math.min(slider.width * scale, slider.width - 28))
  );
  const height = Math.round(width * 1.8);

  return { width, height };
}

/** @deprecated Use getFlyingCardSize — kept for imports that expect a constant name. */
export const SLIDER_CARD_SIZE: TSchemeCardSize = getFlyingCardSize(390);
