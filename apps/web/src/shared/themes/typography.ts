import { TEXT_TAGS } from 'shared/ui/Text/constants';
import { width } from 'shared/lib/responsive';

const MOBILE_MAX_WIDTH = 767;
const TABLET_MAX_WIDTH = 1199;
const MOBILE_BASE_PX = 12;
const TABLET_BASE_PX = 14;
const DESKTOP_BASE_PX = 16;

/**
 * Возвращает единый размер шрифта для текущего диапазона ширины экрана.
 * Для одинаковой ширины устройства значение всегда одинаковое.
 */
const resolveBaseTypographyPx = () => {
  if (width <= MOBILE_MAX_WIDTH) {
    return MOBILE_BASE_PX;
  }

  if (width <= TABLET_MAX_WIDTH) {
    return TABLET_BASE_PX;
  }

  return DESKTOP_BASE_PX;
};

/** Базовый кегль для web: 12px mobile, 14px tablet, 16px desktop. */
export const GLOBAL_UI_TEXT_PX = resolveBaseTypographyPx();

/**
 * Нормализует числовой `fontSize` к единой адаптивной шкале.
 * Сохраняет разницу между размерами, но не даёт опускаться ниже mobile-базы.
 */
export const toResponsiveFontPx = (fontSize: number) => {
  const rawDelta = fontSize - DESKTOP_BASE_PX;
  const normalized = GLOBAL_UI_TEXT_PX + rawDelta;

  return Math.max(MOBILE_BASE_PX, normalized);
};

/**
 * Единая шкала кеглей для `Text` по `category` (абсолютные px, без повторного `moderateScale`).
 *
 * Явный **числовой** `fontSize` в `style` у `Text` остаётся как задан (см. `getTextStyles`).
 */
export const TYPOGRAPHY_CATEGORY_PX: Record<keyof typeof TEXT_TAGS, number> = {
  [TEXT_TAGS.h1]: GLOBAL_UI_TEXT_PX,
  [TEXT_TAGS.h2]: GLOBAL_UI_TEXT_PX,
  [TEXT_TAGS.h3]: GLOBAL_UI_TEXT_PX,
  [TEXT_TAGS.h4]: GLOBAL_UI_TEXT_PX,
  [TEXT_TAGS.h5]: GLOBAL_UI_TEXT_PX,
  [TEXT_TAGS.p1]: GLOBAL_UI_TEXT_PX,
  [TEXT_TAGS.p2]: GLOBAL_UI_TEXT_PX - 2,
  [TEXT_TAGS.label]: GLOBAL_UI_TEXT_PX,
};

/** Экран «Настройки»: фиксированные кегли (абсолютные px для `style`). */
export const SETTINGS_TYPOGRAPHY = {
  body: GLOBAL_UI_TEXT_PX,
  footnote: GLOBAL_UI_TEXT_PX,
} as const;
