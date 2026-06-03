import { Platform } from 'react-native';

/** Минимальная ширина для боковой навигации (десктоп / большой планшет). */
export const TAB_BREAKPOINT_RAIL = 900;

/** Web mobile: круглая FAB-навигация вместо нижней панели. */
export const WEB_FAB_NAV_SIZE = 56;

export function isWebMobileFabNav(width: number): boolean {
  return Platform.OS === 'web' && width < TAB_BREAKPOINT_RAIL;
}

/** Планшет: нижняя панель с подписями к иконкам. */
export const TAB_BREAKPOINT_LABELED = 640;

/** Полная ширина левой рейки с подписями. */
export const TAB_RAIL_WIDTH_EXPANDED = 228;

/** Узкая рейка: только иконки. */
export const TAB_RAIL_WIDTH_COLLAPSED = 76;

/** @deprecated Используйте TAB_RAIL_WIDTH_EXPANDED; оставлено для совместимости импортов. */
export const TAB_RAIL_WIDTH = TAB_RAIL_WIDTH_EXPANDED;

/**
 * Кегль подписей **только** у левой навигационной рейки (sidebar).
 * Остальной UI использует `GLOBAL_UI_TEXT_PX` из `shared/themes/typography`.
 */
/** Кегль подписей навбара: рейка слева и нижняя панель с подписями. */
export const TAB_NAV_LABEL_FONT_PX = 16;

/** @deprecated Используйте TAB_NAV_LABEL_FONT_PX */
export const TAB_RAIL_LABEL_FONT_PX = TAB_NAV_LABEL_FONT_PX;

export type AdaptiveTabVariant = 'compact' | 'labeled' | 'rail';

export function getAdaptiveTabVariant(width: number): AdaptiveTabVariant {
  if (width >= TAB_BREAKPOINT_RAIL) return 'rail';
  if (width >= TAB_BREAKPOINT_LABELED) return 'labeled';
  return 'compact';
}

export const TAB_RAIL_COLLAPSED_SESSION_KEY = 'taro_web_tab_rail_collapsed';

export function readTabRailCollapsedFromSession(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return window.sessionStorage.getItem(TAB_RAIL_COLLAPSED_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}
