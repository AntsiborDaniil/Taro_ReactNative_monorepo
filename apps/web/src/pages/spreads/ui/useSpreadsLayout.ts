import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

const MAX_CONTENT_WIDTH = 1280;
const BASE_W = 375;

/** moderateScale от текущей ширины окна (импорт из lib использует «замороженный» width) */
function ms(screenW: number, size: number, factor = 0.5) {
  return size + ((screenW / BASE_W) * size - size) * factor;
}

export type SpreadsLayout = {
  contentWidth: number;
  padding: number;
  gap: number;
  columns: number;
  cardWidth: number;
  previewHeight: number;
  sectionTitleSize: number;
  sectionTitleLine: number;
  scrollBottomPad: number;
  /** карточка каталога */
  cardBorderRadius: number;
  textPadH: number;
  textPadTop: number;
  textPadBottom: number;
  textBlockGap: number;
  titleFontSize: number;
  hintFontSize: number;
  lockIconSize: number;
  imageFadeHeight: number;
};

/**
 * Сетка и отступы страницы раскладов от реальной ширины/высоты окна (resize, планшеты, ультраширокие мониторы).
 */
export function useSpreadsLayout(): SpreadsLayout {
  const { width: W, height: H } = useWindowDimensions();

  return useMemo(() => {
    const contentWidth = Math.min(W, MAX_CONTENT_WIDTH);
    const padding = Math.round(Math.min(28, Math.max(10, ms(W, 14) + W * 0.02)));
    const gap = Math.round(Math.min(24, Math.max(10, ms(W, 14) + W * 0.015)));

    let columns = 1;
    if (W >= 640) columns = 2;
    if (W >= 1040) columns = 3;

    const inner = contentWidth - 2 * padding;
    const cardWidth =
      columns <= 1
        ? inner
        : (inner - gap * (columns - 1)) / columns;

    const v = (n: number) => (H / 812) * n;
    const byAspect = Math.round(cardWidth * 0.82);
    const floor = columns >= 3 ? v(260) : columns >= 2 ? v(280) : v(300);
    const cap = v(480);
    const previewHeight = Math.min(cap, Math.max(floor, byAspect));

    const sectionTitleSize = Math.round(
      columns === 1
        ? Math.min(21, Math.max(18, ms(W, 19)))
        : columns === 2
          ? Math.min(20, Math.max(16, ms(W, 18)))
          : Math.min(19, Math.max(15, ms(W, 17)))
    );
    const sectionTitleLine = Math.round(sectionTitleSize * 1.35);

    const scrollBottomPad = Math.round(Math.max(24, v(32)));

    const cardBorderRadius = Math.round(Math.min(24, Math.max(12, W * 0.018)));
    const textPadH = Math.round(Math.min(26, Math.max(14, W * 0.045)));
    const textPadTop = Math.round(Math.min(22, Math.max(12, v(16))));
    const textPadBottom = Math.round(Math.min(30, Math.max(18, v(24))));
    const textBlockGap = Math.round(Math.min(16, Math.max(8, v(10))));
    const titleFontSize = Math.round(
      columns === 1
        ? Math.min(18, Math.max(16, ms(W, 16)))
        : columns === 2
          ? Math.min(16, Math.max(14, ms(W, 15)))
          : Math.min(15, Math.max(13, ms(W, 14)))
    );
    const hintFontSize = Math.round(
      columns === 1
        ? Math.min(15, Math.max(13, ms(W, 14)))
        : columns === 2
          ? Math.min(14, Math.max(12, ms(W, 13)))
          : Math.min(13, Math.max(11, ms(W, 12)))
    );
    const lockIconSize = Math.round(Math.min(40, Math.max(28, W * 0.07)));
    const imageFadeHeight = Math.round(Math.min(56, Math.max(36, v(44))));

    return {
      contentWidth,
      padding,
      gap,
      columns,
      cardWidth,
      previewHeight,
      sectionTitleSize,
      sectionTitleLine,
      scrollBottomPad,
      cardBorderRadius,
      textPadH,
      textPadTop,
      textPadBottom,
      textBlockGap,
      titleFontSize,
      hintFontSize,
      lockIconSize,
      imageFadeHeight,
    };
  }, [W, H]);
}
