import { useMemo } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { TAB_BREAKPOINT_RAIL } from 'app/navigation/tabs/adaptiveTabLayout';
import { useWebBottomTabBarInset } from 'shared/lib/web/useWebViewportInsets';

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
  const bottomTabInset = useWebBottomTabBarInset();

  return useMemo(() => {
    const isCompact = W < 430;
    const contentWidth = Math.min(W, MAX_CONTENT_WIDTH);
    const padding = Math.round(
      Math.min(24, Math.max(isCompact ? 10 : 12, ms(W, isCompact ? 12 : 16)))
    );
    const sectionGap = Math.round(
      Math.min(36, Math.max(isCompact ? 12 : 18, ms(W, isCompact ? 14 : 24)))
    );
    const bottomMargin = Math.round(
      Math.min(56, Math.max(isCompact ? 16 : 24, (H / 812) * 36))
    );
    const mobileWebTabPad =
      Platform.OS === 'web' && W < TAB_BREAKPOINT_RAIL ? bottomTabInset : 0;
    const scrollBottomPad = Math.round(
      Math.max(isCompact ? 12 : 18, (H / 812) * 24) + mobileWebTabPad
    );

    return {
      contentWidth,
      padding,
      sectionGap,
      bottomMargin,
      scrollBottomPad,
    };
  }, [W, H, bottomTabInset]);
}
