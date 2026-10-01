import { useCallback, useMemo, useState } from 'react';
import { type LayoutChangeEvent, Platform, useWindowDimensions } from 'react-native';
import { TAB_BREAKPOINT_RAIL } from 'app/navigation/tabs/adaptiveTabLayout';
import { useWebBottomTabBarInset } from 'shared/lib/web/useWebViewportInsets';
import { DS_LAYOUT, DS_SPACE, type DsViewport, getDsViewport } from 'shared/themes/ds';

/** Мобайл/планшет — фиксированные колонки (плотная сетка, проверено скриншотами). */
const FIXED_COLUMNS: Partial<Record<DsViewport, number>> = {
  mobile: 2,
  tablet: 3,
};

/** Desktop/wide — колонки считаем от фактической ширины, чтобы сетка всегда
 *  дозаполняла колонку без «слепого» поля справа (см. ревью: фикс. 4/5 колонок
 *  на 1280/1440 оставляли остаток шириной с половину тайла). */
const IDEAL_TILE_WIDTH = 200;
const MIN_FLUID_COLUMNS = 4;
const MAX_FLUID_COLUMNS = 6;

function computeColumns(
  viewport: DsViewport,
  innerWidth: number,
  tileGap: number
): number {
  const fixed = FIXED_COLUMNS[viewport];
  if (fixed != null) {
    return fixed;
  }
  const raw = Math.round(
    (innerWidth + tileGap) / (IDEAL_TILE_WIDTH + tileGap)
  );
  return Math.min(MAX_FLUID_COLUMNS, Math.max(MIN_FLUID_COLUMNS, raw));
}

export type SpreadsLayout = {
  viewport: DsViewport;
  /** Замер ширины КОНТЕЙНЕРА экрана (onLayout), а не окна — слева может быть рейка навигации. */
  containerWidth: number;
  /** Макс. ширина колонки контента (undefined на mobile — во всю ширину). */
  contentMaxWidth: number | undefined;
  /** Поле экрана (DS §08 — 25). */
  gutter: number;
  /** Зазор между секциями каталога. */
  sectionGap: number;
  /** Зазор заголовок секции → сетка. */
  headingGap: number;
  /** Число колонок сетки тайлов. */
  columns: number;
  /** Зазор между тайлами. */
  tileGap: number;
  /** Ширина тайла (тайл — квадрат, см. dsRadius.window). */
  tileWidth: number;
  /** Отступ снизу у скролла (под FAB/таббар на мобильном web). */
  scrollBottomPad: number;
};

/** Замер ширины контейнера через onLayout — не через useWindowDimensions (рейка съедает часть окна). */
export function useContainerWidth(fallback: number) {
  const [width, setWidth] = useState(fallback);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const measured = Math.round(event.nativeEvent.layout.width);
    setWidth((prev) => (Math.abs(prev - measured) > 0.5 ? measured : prev));
  }, []);

  return [width, onLayout] as const;
}

export function useSpreadsLayout(containerWidth: number): SpreadsLayout {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const bottomTabInset = useWebBottomTabBarInset();

  return useMemo(() => {
    const viewport = getDsViewport(containerWidth);
    const contentMaxWidth = DS_LAYOUT.maxWidth[viewport];
    const gutter = DS_LAYOUT.gutter;
    const sectionGap = DS_LAYOUT.sectionGap[viewport];
    const headingGap = DS_SPACE.m;
    const tileGap = DS_SPACE.l;

    const effectiveWidth = contentMaxWidth
      ? Math.min(containerWidth, contentMaxWidth)
      : containerWidth;
    const innerWidth = Math.max(0, effectiveWidth - gutter * 2);
    const columns = computeColumns(viewport, innerWidth, tileGap);
    const tileWidth = Math.floor(
      (innerWidth - tileGap * (columns - 1)) / columns
    );

    // Рейка навигации — по ширине ОКНА (её видимость решает AdaptiveTabBar), не контейнера.
    const mobileWebTabPad =
      Platform.OS === 'web' && windowWidth < TAB_BREAKPOINT_RAIL
        ? bottomTabInset
        : 0;
    const scrollBottomPad = Math.round(
      Math.max(24, (windowHeight / 812) * 32) + mobileWebTabPad
    );

    return {
      viewport,
      containerWidth,
      contentMaxWidth,
      gutter,
      sectionGap,
      headingGap,
      columns,
      tileGap,
      tileWidth: Math.max(0, tileWidth),
      scrollBottomPad,
    };
  }, [containerWidth, windowWidth, windowHeight, bottomTabInset]);
}
