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
  bannerSubtitleFontSize: number;
  bannerActionFontSize: number;
  /** Подпись на плитках категорий. */
  cardTitleFontSize: number;
  /** Лид под шапкой библиотеки. */
  libraryIntroFontSize: number;
  /** Заголовок секции над сеткой. */
  librarySectionTitleFontSize: number;
  /** Подпись под плиткой библиотеки. */
  libraryTileSubtitleFontSize: number;
  libraryTileSubtitleLineHeight: number;
  scrollBottomPad: number;
  isNarrow: boolean;
  /** Учтена левая навигационная рейка (широкий web). */
  hasTabRail: boolean;
  columnCount: number;
  gridJustifyContent: 'flex-start' | 'center';
  /** Отступ внутри рамки сетки (горизонтально и вертикально). */
  gridShellPadding: number;
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
      Math.min(16, Math.max(8, ms(layoutW, 11) + layoutW * 0.01))
    );
    const gap = Math.round(
      Math.min(14, Math.max(8, ms(layoutW, 11) + layoutW * 0.01))
    );

    const inner = Math.max(0, contentWidth - 2 * padding);
    const gridShellPadding = Math.round(Math.min(12, Math.max(9, gap)));
    const gridInner = Math.max(0, inner - 2 * gridShellPadding);

    let columnCount = 1;
    if (gridInner >= MIN_CARD_W * 3 + gap * 2) columnCount = 3;
    else if (gridInner >= MIN_CARD_W * 2 + gap) columnCount = 2;

    columnCount = Math.min(columnCount, LIBRARY_CARD_COUNT);

    const cardWidth =
      columnCount <= 1
        ? gridInner
        : (gridInner - gap * (columnCount - 1)) / columnCount;

    const orphanLastRow =
      columnCount > 1 && LIBRARY_CARD_COUNT % columnCount !== 0;
    const gridJustifyContent: 'flex-start' | 'center' = orphanLastRow
      ? 'center'
      : 'flex-start';

    const v = (n: number) => (H / 812) * n;
    const singleColumnCardHeight = Math.round(
      Math.min(164, Math.max(124, Math.min(v(138), inner * 0.4)))
    );
    const multiColumnCardHeight = Math.round(
      Math.min(210, Math.max(138, v(162)))
    );
    const cardHeight =
      columnCount === 1 ? singleColumnCardHeight : multiColumnCardHeight;
    const cornerImageWidth = Math.round(
      Math.min(124, Math.max(72, cardWidth * 0.44))
    );
    const cornerImageHeight = Math.round(
      Math.min(132, Math.max(78, cardHeight * 0.62))
    );

    const bannerPadding = Math.round(
      Math.min(22, Math.max(12, ms(layoutW, 16)))
    );
    const bannerHeight = Math.round(
      Math.min(216, Math.max(150, v(166) + bannerPadding))
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
    const FONT_BUMP = 4;
    const bannerTitleFontSize = Math.min(
      23,
      Math.max(19, Math.round(GLOBAL_UI_TEXT_PX + 4 + FONT_BUMP))
    );
    const bannerSubtitleFontSize = GLOBAL_UI_TEXT_PX + FONT_BUMP;
    const bannerActionFontSize = Math.min(
      19,
      Math.max(16, GLOBAL_UI_TEXT_PX + FONT_BUMP)
    );
    const cardTitleFontSize = GLOBAL_UI_TEXT_PX + FONT_BUMP + 2;
    const libraryTileSubtitleFontSize = Math.max(
      14,
      Math.round(cardTitleFontSize - 3)
    );
    const libraryTileSubtitleLineHeight = Math.round(
      libraryTileSubtitleFontSize + 6
    );
    const libraryIntroFontSize = GLOBAL_UI_TEXT_PX + FONT_BUMP;
    const librarySectionTitleFontSize = Math.min(
      26,
      Math.max(18, Math.round(GLOBAL_UI_TEXT_PX + 6 + FONT_BUMP))
    );

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
      bannerSubtitleFontSize,
      bannerActionFontSize,
      cardTitleFontSize,
      libraryIntroFontSize,
      librarySectionTitleFontSize,
      libraryTileSubtitleFontSize,
      libraryTileSubtitleLineHeight,
      scrollBottomPad: Math.round(Math.max(28, v(36))),
      isNarrow: layoutW < TAB_BREAKPOINT_LABELED,
      hasTabRail,
      columnCount,
      gridJustifyContent,
      gridShellPadding,
    };
  }, [W, H, effectiveRailWidth]);
}
