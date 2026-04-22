import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { GLOBAL_UI_TEXT_PX } from 'shared/themes/typography';

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
  categoryColumns: 1 | 2;
  categoryGap: number;
  affirmationCardWidth: number;
  affirmationCardHeight: number;
  listPaddingBottom: number;
  visualSize: number;
  isNarrow: boolean;
  labelFontSize: number;
  categoryTitleSize: number;
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
    const categoryColumns: 1 | 2 = W <= 1280 ? 1 : 2;
    const categoryGap = W < 760 ? 10 : 12;
    const affirmationCardWidth = Math.max(
      120,
      categoryColumns === 1
        ? columnInner
        : (columnInner - categoryGap) / categoryColumns
    );
    const affirmationCardHeight = Math.round(
      Math.min(116, Math.max(92, ms(W, categoryColumns === 1 ? 108 : 98)))
    );
    const listPaddingBottom = W < 760 ? 10 : 14;
    const visualSize = Math.round(
      Math.min(560, Math.max(280, columnInner))
    );
    const categoryTitleSize = Math.round(
      Math.min(34, Math.max(18, ms(W, categoryColumns === 1 ? 22 : 16)))
    );

    return {
      contentWidth,
      padding,
      sectionGap,
      columnInner,
      categoryColumns,
      categoryGap,
      affirmationCardWidth,
      affirmationCardHeight,
      listPaddingBottom,
      visualSize,
      isNarrow: W < 640,
      labelFontSize: GLOBAL_UI_TEXT_PX,
      categoryTitleSize,
    };
  }, [W]);
}
