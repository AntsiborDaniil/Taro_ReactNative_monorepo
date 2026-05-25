import { Platform } from 'react-native';
import { TEXT_TAGS } from 'shared/ui/Text/constants';

/** Минимальная ширина viewport (px), mobile — всё что ниже tablet. */
export const RESPONSIVE_BREAKPOINTS = {
  tablet: 768,
  laptop: 1024,
  desktop: 1440,
  wide: 1920,
} as const;

export type ViewportTier =
  | 'mobile'
  | 'tablet'
  | 'laptop'
  | 'desktop'
  | 'wide';

export const CSS_VARS = {
  titleDisplay: '--font-title-display',
  titlePage: '--font-title-page',
  titleSection: '--font-title-section',
  titleCard: '--font-title-card',
  titleSubtle: '--font-title-subtle',
  fontBase: '--font-size-base',
  fontBody: '--font-size-body',
  fontH1: '--font-h1',
  fontH2: '--font-h2',
  fontH3: '--font-h3',
  fontH4: '--font-h4',
  fontH5: '--font-h5',
  fontP1: '--font-p1',
  fontP2: '--font-p2',
  fontLabel: '--font-label',
} as const;

/** Числовые кегли (px) — зеркало responsive-tokens.css для RN StyleSheet. */
export const TYPOGRAPHY_PX_BY_TIER: Record<
  ViewportTier,
  {
    base: number;
    titleDisplay: number;
    titlePage: number;
    titleSection: number;
    titleCard: number;
    titleSubtle: number;
    body: number;
    bodyLg: number;
    label: number;
    caption: number;
  }
> = {
  mobile: {
    base: 12,
    titleDisplay: 22,
    titlePage: 20,
    titleSection: 16,
    titleCard: 15,
    titleSubtle: 14,
    body: 12,
    bodyLg: 13,
    label: 11,
    caption: 10,
  },
  tablet: {
    base: 13,
    titleDisplay: 24,
    titlePage: 22,
    titleSection: 17,
    titleCard: 16,
    titleSubtle: 15,
    body: 13,
    bodyLg: 14,
    label: 12,
    caption: 11,
  },
  laptop: {
    base: 14,
    titleDisplay: 26,
    titlePage: 24,
    titleSection: 18,
    titleCard: 17,
    titleSubtle: 16,
    body: 14,
    bodyLg: 15,
    label: 13,
    caption: 12,
  },
  desktop: {
    base: 15,
    titleDisplay: 28,
    titlePage: 26,
    titleSection: 19,
    titleCard: 18,
    titleSubtle: 17,
    body: 15,
    bodyLg: 16,
    label: 14,
    caption: 13,
  },
  wide: {
    base: 16,
    titleDisplay: 32,
    titlePage: 28,
    titleSection: 20,
    titleCard: 19,
    titleSubtle: 18,
    body: 16,
    bodyLg: 17,
    label: 14,
    caption: 13,
  },
};

export const TEXT_CATEGORY_TO_TOKEN: Record<
  keyof typeof TEXT_TAGS,
  keyof (typeof TYPOGRAPHY_PX_BY_TIER)['mobile']
> = {
  [TEXT_TAGS.h1]: 'titleDisplay',
  [TEXT_TAGS.h2]: 'titlePage',
  [TEXT_TAGS.h3]: 'titleSection',
  [TEXT_TAGS.h4]: 'titleCard',
  [TEXT_TAGS.h5]: 'titleSubtle',
  [TEXT_TAGS.p1]: 'body',
  [TEXT_TAGS.p2]: 'caption',
  [TEXT_TAGS.label]: 'label',
};

export function getViewportTier(width: number): ViewportTier {
  if (width >= RESPONSIVE_BREAKPOINTS.wide) {
    return 'wide';
  }
  if (width >= RESPONSIVE_BREAKPOINTS.desktop) {
    return 'desktop';
  }
  if (width >= RESPONSIVE_BREAKPOINTS.laptop) {
    return 'laptop';
  }
  if (width >= RESPONSIVE_BREAKPOINTS.tablet) {
    return 'tablet';
  }
  return 'mobile';
}

export function getTypographyPxForWidth(
  width: number,
  token: keyof (typeof TYPOGRAPHY_PX_BY_TIER)['mobile']
): number {
  const tier = getViewportTier(width);
  return TYPOGRAPHY_PX_BY_TIER[tier][token];
}

let cssVarCache: Map<string, number> | null = null;

function parseCssPx(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  const value = Number.parseFloat(trimmed);
  return Number.isFinite(value) ? value : null;
}

/** На web читает актуальное значение CSS-переменной с :root (после инъекции responsive-tokens.css). */
export function readCssVarPx(
  varName: string,
  fallback: number
): number {
  if (
    Platform.OS !== 'web' ||
    typeof document === 'undefined' ||
    !document.documentElement
  ) {
    return fallback;
  }

  const cached = cssVarCache?.get(varName);
  if (cached != null) {
    return cached;
  }

  const raw = getComputedStyle(document.documentElement).getPropertyValue(
    varName
  );
  const parsed = parseCssPx(raw);
  const value = parsed ?? fallback;

  if (!cssVarCache) {
    cssVarCache = new Map();
  }
  cssVarCache.set(varName, value);

  return value;
}

/** Сброс кеша после resize / смены брейкпоинта (вызывать из провайдера). */
export function clearCssVarCache(): void {
  cssVarCache = null;
}

export const CATEGORY_CSS_VAR: Record<keyof typeof TEXT_TAGS, string> = {
  [TEXT_TAGS.h1]: CSS_VARS.fontH1,
  [TEXT_TAGS.h2]: CSS_VARS.fontH2,
  [TEXT_TAGS.h3]: CSS_VARS.fontH3,
  [TEXT_TAGS.h4]: CSS_VARS.fontH4,
  [TEXT_TAGS.h5]: CSS_VARS.fontH5,
  [TEXT_TAGS.p1]: CSS_VARS.fontP1,
  [TEXT_TAGS.p2]: CSS_VARS.fontP2,
  [TEXT_TAGS.label]: CSS_VARS.fontLabel,
};
