import { Platform } from 'react-native';
import { width } from 'shared/lib/responsive/responsive';
import { TEXT_TAGS } from 'shared/ui/Text/constants';
import {
  CATEGORY_CSS_VAR,
  getTypographyPxForWidth,
  getViewportTier,
  readCssVarPx,
  TEXT_CATEGORY_TO_TOKEN,
  TYPOGRAPHY_PX_BY_TIER,
  type ViewportTier,
} from './responsive-tokens';

export {
  CSS_VARS,
  RESPONSIVE_BREAKPOINTS,
  getViewportTier,
  getTypographyPxForWidth,
  readCssVarPx,
  TYPOGRAPHY_PX_BY_TIER,
} from './responsive-tokens';

const tier = getViewportTier(width);

export function getGlobalUiTextPx(): number {
  const currentWidth =
    typeof globalThis !== 'undefined' &&
    'window' in globalThis &&
    globalThis.window
      ? globalThis.window.innerWidth
      : width;
  const currentTier = getViewportTier(currentWidth);
  const base = TYPOGRAPHY_PX_BY_TIER[currentTier].base;

  if (Platform.OS === 'web') {
    return readCssVarPx('--font-size-base', base);
  }

  return base;
}

/**
 * Базовый кегль (при импорте). Для актуального значения после resize — `getGlobalUiTextPx()`.
 */
export const GLOBAL_UI_TEXT_PX = getGlobalUiTextPx();

export function resolveCategoryPx(category: keyof typeof TEXT_TAGS): number {
  const currentWidth =
    typeof globalThis !== 'undefined' &&
    'window' in globalThis &&
    globalThis.window
      ? globalThis.window.innerWidth
      : width;
  const currentTier = getViewportTier(currentWidth);
  const tokens = TYPOGRAPHY_PX_BY_TIER[currentTier];
  const tokenKey = TEXT_CATEGORY_TO_TOKEN[category];
  const fallback = tokens[tokenKey];

  if (Platform.OS === 'web') {
    const cssVar = CATEGORY_CSS_VAR[category];
    return readCssVarPx(cssVar, fallback);
  }

  return getTypographyPxForWidth(currentWidth, tokenKey);
}

/**
 * Нормализует числовой `fontSize` к единой адаптивной шкале.
 * Сохраняет разницу относительно базового кегля текущего tier.
 */
export const toResponsiveFontPx = (fontSize: number) => {
  const laptopBase = TYPOGRAPHY_PX_BY_TIER.laptop.base;
  const rawDelta = fontSize - laptopBase;
  const normalized = getGlobalUiTextPx() + rawDelta;

  return Math.max(TYPOGRAPHY_PX_BY_TIER.mobile.base, normalized);
};

/**
 * Единая шкала кеглей для `Text` по `category` (снимок при импорте).
 * В рантайме `getTextStyles` вызывает `resolveCategoryPx`.
 */
export const TYPOGRAPHY_CATEGORY_PX: Record<keyof typeof TEXT_TAGS, number> = {
  [TEXT_TAGS.h1]: resolveCategoryPx(TEXT_TAGS.h1),
  [TEXT_TAGS.h2]: resolveCategoryPx(TEXT_TAGS.h2),
  [TEXT_TAGS.h3]: resolveCategoryPx(TEXT_TAGS.h3),
  [TEXT_TAGS.h4]: resolveCategoryPx(TEXT_TAGS.h4),
  [TEXT_TAGS.h5]: resolveCategoryPx(TEXT_TAGS.h5),
  [TEXT_TAGS.p1]: resolveCategoryPx(TEXT_TAGS.p1),
  [TEXT_TAGS.p2]: resolveCategoryPx(TEXT_TAGS.p2),
  [TEXT_TAGS.label]: resolveCategoryPx(TEXT_TAGS.label),
};

function getCurrentWidth(): number {
  if (
    typeof globalThis !== 'undefined' &&
    'window' in globalThis &&
    globalThis.window
  ) {
    return globalThis.window.innerWidth;
  }
  return width;
}

/** Семантические заголовки (Header, экран, секция, карточка). */
export const TITLE_TYPOGRAPHY = {
  display: () => {
    const w = getCurrentWidth();
    const t = TYPOGRAPHY_PX_BY_TIER[getViewportTier(w)];
    return Platform.OS === 'web'
      ? readCssVarPx('--font-title-display', t.titleDisplay)
      : getTypographyPxForWidth(w, 'titleDisplay');
  },
  page: () => {
    const w = getCurrentWidth();
    const t = TYPOGRAPHY_PX_BY_TIER[getViewportTier(w)];
    return Platform.OS === 'web'
      ? readCssVarPx('--font-title-page', t.titlePage)
      : getTypographyPxForWidth(w, 'titlePage');
  },
  section: () => {
    const w = getCurrentWidth();
    const t = TYPOGRAPHY_PX_BY_TIER[getViewportTier(w)];
    return Platform.OS === 'web'
      ? readCssVarPx('--font-title-section', t.titleSection)
      : getTypographyPxForWidth(w, 'titleSection');
  },
  card: () => {
    const w = getCurrentWidth();
    const t = TYPOGRAPHY_PX_BY_TIER[getViewportTier(w)];
    return Platform.OS === 'web'
      ? readCssVarPx('--font-title-card', t.titleCard)
      : getTypographyPxForWidth(w, 'titleCard');
  },
  subtle: () => {
    const w = getCurrentWidth();
    const t = TYPOGRAPHY_PX_BY_TIER[getViewportTier(w)];
    return Platform.OS === 'web'
      ? readCssVarPx('--font-title-subtle', t.titleSubtle)
      : getTypographyPxForWidth(w, 'titleSubtle');
  },
} as const;

/** Экран «Настройки»: те же токены, что body/base. */
export const SETTINGS_TYPOGRAPHY = {
  get body() {
    return getGlobalUiTextPx();
  },
  get footnote() {
    return getGlobalUiTextPx();
  },
} as const;

/** Текущий tier viewport (для layout-хуков). */
export const CURRENT_VIEWPORT_TIER: ViewportTier = tier;
