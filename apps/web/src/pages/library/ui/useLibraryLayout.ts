import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import {
  TAB_BREAKPOINT_LABELED,
  TAB_BREAKPOINT_RAIL,
} from 'app/navigation/tabs/adaptiveTabLayout';
import { useTabRailLayout } from 'app/navigation/tabs/TabRailLayoutContext';
import { GLOBAL_UI_TEXT_PX } from 'shared/themes/typography';
import { LIBRARY_PLATES } from '../lib';

const MAX_CONTENT_WIDTH = 1280;
const BASE_W = 375;
const LIBRARY_CARD_COUNT = LIBRARY_PLATES.length;
/** Минимальная ширина плитки до перехода на меньшее число колонок. */
const MIN_CARD_W = 158;

function ms(screenW: number, size: number, factor = 0.5) {
  return size + ((screenW / BASE_W) * size - size) * factor;
}

export type LibraryLayout = {
  contentWidth: number;
  padding: number;
  gap: number;
  cardWidth: number;
  cardHeight: number;
  cornerImageWidth: number;
  cornerImageHeight: number;
  bannerHeight: number;
  bannerImageWidth: number;
  bannerImageHeight: number;
  bannerImageMaxHeight: number;
  bannerBorderRadius: number;
  bannerPadding: number;
  bannerTitleFontSize: number;
  /** Подпись на плитках категорий. */
  cardTitleFontSize: number;
  scrollBottomPad: number;
  isNarrow: boolean;
  /** Учтена левая навигационная рейка (широкий web). */
  hasTabRail: boolean;
  columnCount: number;
  gridJustifyContent: 'flex-start' | 'center';
};

/**
 * Колонка и сетка библиотеки: `useWindowDimensions` даёт полную ширину окна —
 * при боковой навигации вычитаем ширину рейки, чтобы контент не уезжал под неё.
 */
export function useLibraryLayout(): LibraryLayout {
  const { width: W, height: H } = useWindowDimensions();
  const { effectiveRailWidth } = useTabRailLayout();

  return useMemo(() => {
    const hasTabRail = W >= TAB_BREAKPOINT_RAIL;
    const layoutW = hasTabRail ? W - effectiveRailWidth : W;

    const contentWidth = Math.min(layoutW, MAX_CONTENT_WIDTH);
    const padding = Math.round(
      Math.min(28, Math.max(10, ms(layoutW, 14) + layoutW * 0.02))
    );
    const gap = Math.round(
      Math.min(24, Math.max(10, ms(layoutW, 14) + layoutW * 0.015))
    );

    const inner = Math.max(0, contentWidth - 2 * padding);

    let columnCount = 1;
    if (inner >= MIN_CARD_W * 3 + gap * 2) columnCount = 3;
    else if (inner >= MIN_CARD_W * 2 + gap) columnCount = 2;

    columnCount = Math.min(columnCount, LIBRARY_CARD_COUNT);

    const cardWidth =
      columnCount <= 1
        ? inner
        : (inner - gap * (columnCount - 1)) / columnCount;

    const orphanLastRow =
      columnCount > 1 && LIBRARY_CARD_COUNT % columnCount !== 0;
    const gridJustifyContent: 'flex-start' | 'center' = orphanLastRow
      ? 'center'
      : 'flex-start';

    const v = (n: number) => (H / 812) * n;
    const cardHeight = Math.round(Math.min(196, Math.max(132, v(154))));
    const cornerImageWidth = Math.round(
      Math.min(152, Math.max(84, cardWidth * 0.54))
    );
    const cornerImageHeight = Math.round(
      Math.min(158, Math.max(92, cardHeight * 0.78))
    );

    const bannerPadding = Math.round(
      Math.min(22, Math.max(12, ms(layoutW, 16)))
    );
    const bannerHeight = Math.round(
      Math.min(228, Math.max(156, v(172) + bannerPadding))
    );
    const bannerImageMaxHeight = Math.max(
      100,
      bannerHeight - bannerPadding * 2 - 8
    );
    const bannerImageWidth = Math.round(
      Math.min(260, Math.max(120, Math.min(inner, 640) * 0.34))
    );
    const bannerImageHeight = Math.round(
      Math.min(
        bannerImageMaxHeight + 32,
        Math.max(132, bannerImageMaxHeight * 1.12)
      )
    );
    const bannerBorderRadius = Math.round(
      Math.min(24, Math.max(12, layoutW * 0.018))
    );
    const bannerTitleFontSize = GLOBAL_UI_TEXT_PX;
    const cardTitleFontSize = GLOBAL_UI_TEXT_PX;

    return {
      contentWidth,
      padding,
      gap,
      cardWidth,
      cardHeight,
      cornerImageWidth,
      cornerImageHeight,
      bannerHeight,
      bannerImageWidth,
      bannerImageHeight,
      bannerImageMaxHeight,
      bannerBorderRadius,
      bannerPadding,
      bannerTitleFontSize,
      cardTitleFontSize,
      scrollBottomPad: Math.round(Math.max(28, v(36))),
      isNarrow: layoutW < TAB_BREAKPOINT_LABELED,
      hasTabRail,
      columnCount,
      gridJustifyContent,
    };
  }, [W, H, effectiveRailWidth]);
}
