import { TEXT_TAGS } from 'shared/ui/Text/constants';

/** Базовый кегль основного текста и подписей на web (единый по приложению). */
export const GLOBAL_UI_TEXT_PX = 22;

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
  [TEXT_TAGS.label]: GLOBAL_UI_TEXT_PX,
};

/** Экран «Настройки»: фиксированные кегли (абсолютные px для `style`). */
export const SETTINGS_TYPOGRAPHY = {
  body: GLOBAL_UI_TEXT_PX,
  footnote: GLOBAL_UI_TEXT_PX,
} as const;
