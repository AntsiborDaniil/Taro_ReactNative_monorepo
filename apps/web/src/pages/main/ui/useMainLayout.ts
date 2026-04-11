import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

const MAX_CONTENT_WIDTH = 1280;
const BASE_W = 375;

function ms(screenW: number, size: number, factor = 0.5) {
  return size + ((screenW / BASE_W) * size - size) * factor;
}

export type MainLayout = {
  /** Макс. ширина колонки контента */
  contentWidth: number;
  /** Горизонтальные поля экрана */
  padding: number;
  /** Вертикальный зазор между крупными блоками */
  sectionGap: number;
  /** Отступ снизу у основного скролла */
  bottomMargin: number;
  scrollBottomPad: number;
};

/**
 * Адаптив главной: resize окна, узкий/широкий экран, ограничение ширины колонки.
 */
export function useMainLayout(): MainLayout {
  const { width: W, height: H } = useWindowDimensions();

  return useMemo(() => {
    const contentWidth = Math.min(W, MAX_CONTENT_WIDTH);
    const padding = Math.round(Math.min(28, Math.max(12, ms(W, 16))));
    const sectionGap = Math.round(
      Math.min(44, Math.max(22, ms(W, 32) + (H / 812) * 4))
    );
    const bottomMargin = Math.round(
      Math.min(56, Math.max(28, (H / 812) * 44))
    );
    const scrollBottomPad = Math.round(Math.max(20, (H / 812) * 28));

    return {
      contentWidth,
      padding,
      sectionGap,
      bottomMargin,
      scrollBottomPad,
    };
  }, [W, H]);
}
