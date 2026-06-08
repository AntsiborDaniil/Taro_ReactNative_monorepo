import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { horizontalScale, isTablet } from 'shared/lib/responsive/responsive';
import type { TSchemeCardSize } from 'shared/types';

const CARD_ASPECT = 94 / 53;
/** Screen padding + glass panel padding + side margins. */
const SCHEME_HORIZONTAL_INSET = 96;

export function useSchemeLayoutMetrics() {
  const { width: windowWidth } = useWindowDimensions();

  return useMemo(() => {
    const available = Math.max(160, windowWidth - SCHEME_HORIZONTAL_INSET);
    const baseW = isTablet ? horizontalScale(36) : horizontalScale(53);
    const rowGap = 12;
    const maxCardsPerRow = 4;
    const fitCardW =
      (available - rowGap * (maxCardsPerRow - 1)) / maxCardsPerRow;
    const cardW = Math.min(baseW, fitCardW);
    const width = Math.max(22, Math.round(cardW));

    const gapScale = Math.min(1, available / 300);

    const cardSize: TSchemeCardSize = {
      width,
      height: Math.round(width * CARD_ASPECT),
    };

    return { cardSize, gapScale, availableWidth: available };
  }, [windowWidth]);
}
