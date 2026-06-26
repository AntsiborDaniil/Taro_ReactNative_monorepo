import {
  horizontalScale,
  isTablet,
  verticalScale,
} from 'shared/lib/responsive/responsive';
import { TSchemeCardSize } from '../types';

const CARD_ASPECT = 94 / 53;
const SCHEME_HORIZONTAL_INSET = 96;

function buildCardSize(): TSchemeCardSize {
  return {
    width: isTablet ? horizontalScale(36) : horizontalScale(53),
    height: verticalScale(94),
  };
}

export const SCHEME_CARD_SIZE: TSchemeCardSize = buildCardSize();

/** Scheme slot size — matches useSchemeLayoutMetrics for flying-card landing. */
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
    height: Math.round(width * CARD_ASPECT),
  };
}

/** Full-size card while flying from carousel to scheme (matches CoverFlow carousel). */
export function getFlyingCardSize(screenWidth: number): TSchemeCardSize {
  const carouselWidth = Math.max(200, Math.min(380, screenWidth - 48));
  const ratio =
    screenWidth < 360 ? 0.58 : screenWidth >= 768 ? 0.54 : 0.6;
  const minW = screenWidth < 360 ? 118 : 136;
  const maxW = screenWidth >= 768 ? 188 : 210;
  const width = Math.round(
    Math.min(maxW, Math.max(minW, carouselWidth * ratio))
  );
  const height = Math.round(width * 1.77);
  return { width, height };
}

/** @deprecated Use getFlyingCardSize — kept for imports that expect a constant name. */
export const SLIDER_CARD_SIZE: TSchemeCardSize = getFlyingCardSize(390);
