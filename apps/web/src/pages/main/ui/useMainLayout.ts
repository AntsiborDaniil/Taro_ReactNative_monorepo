import { useMemo } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { TAB_BREAKPOINT_RAIL } from 'app/navigation/tabs/adaptiveTabLayout';
import { useWebBottomTabBarInset } from 'shared/lib/web/useWebViewportInsets';
import { DS_LAYOUT, type DsViewport, getDsViewport } from 'shared/themes/ds';

export type MainLayout = {
  viewport: DsViewport;
  /** Поле экрана — 25 на всех ширинах (DS §08). */
  gutter: number;
  sectionGap: number;
  maxWidth: number | undefined;
  /** Две колонки на desktop/wide: flex 7 / 5, а не пиксельный расчёт. */
  isTwoColumn: boolean;
  /** Отступ снизу у основного скролла (под FAB/таббар на мобильном web). */
  scrollBottomPad: number;
};

/**
 * Адаптив главной. `containerWidth` — измеренная ширина фактического контейнера
 * колонки (onLayout в Main.tsx), а не `useWindowDimensions`: на ≥900 px слева
 * стоит рейка навигации (76–228 px), и ширина окна больше реально доступной
 * колонки контента — раньше это ломало 2-колоночную раскладку на 1280.
 * Пока контейнер не измерен (первый рендер), используем ширину окна как
 * разумное приближение.
 */
export function useMainLayout(containerWidth: number): MainLayout {
  const { width: W, height: H } = useWindowDimensions();
  const bottomTabInset = useWebBottomTabBarInset();

  return useMemo(() => {
    const viewport = getDsViewport(containerWidth || W);
    const isTwoColumn = viewport === 'desktop' || viewport === 'wide';

    const mobileWebTabPad =
      Platform.OS === 'web' && W < TAB_BREAKPOINT_RAIL ? bottomTabInset : 0;
    const scrollBottomPad = Math.round(
      Math.max(12, (H / 812) * 24) + mobileWebTabPad
    );

    return {
      viewport,
      gutter: DS_LAYOUT.gutter,
      sectionGap: DS_LAYOUT.sectionGap[viewport],
      maxWidth: DS_LAYOUT.maxWidth[viewport],
      isTwoColumn,
      scrollBottomPad,
    };
  }, [containerWidth, W, H, bottomTabInset]);
}
