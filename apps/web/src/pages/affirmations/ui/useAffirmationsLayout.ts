import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

const MAX_CONTENT_WIDTH = 1280;
const BASE_W = 375;

function ms(screenW: number, size: number, factor = 0.5) {
  return size + ((screenW / BASE_W) * size - size) * factor;
}

export type AffirmationsLayout = {
  contentWidth: number;
  padding: number;
  sectionGap: number;
  columnInner: number;
  affirmationCardWidth: number;
  affirmationCardHeight: number;
  listPaddingBottom: number;
  visualSize: number;
  isNarrow: boolean;
  labelFontSize: number;
};

/**
 * Центрированная колонка и размеры карточек категорий — в духе страницы раскладов.
 */
export function useAffirmationsLayout(): AffirmationsLayout {
  const { width: W } = useWindowDimensions();

  return useMemo(() => {
    const contentWidth = Math.min(W, MAX_CONTENT_WIDTH);
    const padding = Math.round(
      Math.min(28, Math.max(10, ms(W, 14) + W * 0.02))
    );
    const sectionGap = Math.round(
      Math.min(18, Math.max(8, ms(W, 12)))
    );
    const columnInner = Math.round(contentWidth - 2 * padding);
    const rowGap = 12;
    const affirmationCardWidth = Math.max(
      120,
      (columnInner - rowGap) / 2
    );
    const affirmationCardHeight = Math.round(
      Math.min(108, Math.max(92, ms(W, 100)))
    );
    const listPaddingBottom = 24;
    const visualSize = Math.round(
      Math.min(560, Math.max(280, columnInner))
    );

    return {
      contentWidth,
      padding,
      sectionGap,
      columnInner,
      affirmationCardWidth,
      affirmationCardHeight,
      listPaddingBottom,
      visualSize,
      isNarrow: W < 640,
      labelFontSize: Math.round(Math.min(15, Math.max(13, ms(W, 14)))),
    };
  }, [W]);
}
