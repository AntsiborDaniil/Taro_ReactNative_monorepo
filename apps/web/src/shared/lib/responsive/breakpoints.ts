import { useWindowDimensions } from 'react-native';

/** Screen-width breakpoints (px) */
export const BP = {
  /** 0–767  → mobile */
  sm: 768,
  /** 768–1199 → tablet */
  md: 1200,
} as const;

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export function getBreakpoint(w: number): Breakpoint {
  if (w < BP.sm) return 'mobile';
  if (w < BP.md) return 'tablet';
  return 'desktop';
}

/** Reactive breakpoint — updates when the window is resized */
export function useBreakpoint(): Breakpoint {
  const { width } = useWindowDimensions();
  return getBreakpoint(width);
}

/**
 * Max-width for the app shell at each breakpoint.
 * Only mobile is capped (430 px); tablet and desktop fill the full viewport.
 */
export const SHELL_MAX_WIDTH: Record<Breakpoint, number> = {
  mobile: 430,
  tablet: 99999,
  desktop: 99999,
};

/** Sidebar widths */
export const SIDEBAR_WIDTH: Record<'tablet' | 'desktop', number> = {
  tablet: 72,
  desktop: 220,
};
