import {
  horizontalScale,
  isTablet,
  verticalScale,
} from 'shared/lib/responsive/responsive';
import { TSchemeCardSize } from '../types';

const CARD_ASPECT = 1.77;
const SCHEME_HORIZONTAL_INSET = 96;

function buildCardSize(): TSchemeCardSize {
  return {
    width: isTablet ? horizontalScale(36) : horizontalScale(53),
    height: verticalScale(94),
  };
}

export const SCHEME_CARD_SIZE: TSchemeCardSize = buildCardSize();

/** CoverFlow carousel card — matches CoverFlowCardCarousel sizing. */
export function getCarouselCardSize(screenWidth: number): TSchemeCardSize {
  const carouselWidth = Math.max(200, Math.min(380, screenWidth - 48));
  const ratio =
    screenWidth < 360 ? 0.58 : screenWidth >= 768 ? 0.54 : 0.6;
  const minW = screenWidth < 360 ? 118 : 132;
  const maxW = screenWidth >= 768 ? 188 : 208;
  const width = Math.round(
    Math.min(maxW, Math.max(minW, carouselWidth * ratio))
  );
  return { width, height: Math.round(width * CARD_ASPECT) };
}

/**
 * Small preview clone beside the slider card (visible on tap before flight).
 * ~36–42% of carousel card width, clamped for tiny and large screens.
 */
export function getPreviewCardSize(
  screenWidth: number,
  carouselSize: TSchemeCardSize
): TSchemeCardSize {
  const ratio =
    screenWidth < 360 ? 0.4 : screenWidth >= 768 ? 0.36 : 0.42;
  const minW = screenWidth < 360 ? 46 : 52;
  const maxW = screenWidth >= 768 ? 72 : 80;
  const width = Math.round(
    Math.min(maxW, Math.max(minW, carouselSize.width * ratio))
  );
  return { width, height: Math.round(width * CARD_ASPECT) };
}

/** Scheme slot size — matches useSchemeLayoutMetrics for landing. */
export function getSchemeCardSize(screenWidth: number): TSchemeCardSize {
  const available = Math.max(160, screenWidth - SCHEME_HORIZONTAL_INSET);
  const baseW = isTablet ? horizontalScale(36) : horizontalScale(53);
  const rowGap = 12;
  const maxCardsPerRow = 4;
  const fitCardW = (available - rowGap * (maxCardsPerRow - 1)) / maxCardsPerRow;
  const cardW = Math.min(baseW, fitCardW);
  const width = Math.max(22, Math.round(cardW));

  return {
    width,
    height: Math.round(width * (94 / 53)),
  };
}

/** Animated flying card dimensions (small preview beside slider). */
export function getFlyingCardSize(screenWidth: number): TSchemeCardSize {
  return getPreviewCardSize(screenWidth, getCarouselCardSize(screenWidth));
}

/** @deprecated Use getCarouselCardSize / getPreviewCardSize. */
export const SLIDER_CARD_SIZE: TSchemeCardSize = getCarouselCardSize(390);
