import { Platform, type TextStyle } from 'react-native';
import { DS_FONT_FAMILY, type DsViewport } from 'shared/themes/ds';

/**
 * Ширина тайла расклада (design-system.html §… «Популярные расклады» брифа
 * редизайна). Размер конкретного компонента главной, не входит в общий
 * `shared/themes/ds` (там нет per-компонентных размеров тайлов).
 */
export const SPREAD_CARD_WIDTH: Record<DsViewport, number> = {
  mobile: 148,
  tablet: 168,
  desktop: 184,
  wide: 200,
};

const webFallback = (family: string) =>
  Platform.OS === 'web' ? `'${family}', system-ui, sans-serif` : family;

/**
 * «Имя» строки списка / карточки расклада — Onest 700 16 (design-system.html
 * §11, «Строка списка» / карточка тайла). Отдельная роль компонента, не входит
 * в общую шкалу §06 (`DS_TYPE`), поэтому не может быть выражена через `dsText`.
 * Переиспользует `DS_FONT_FAMILY.onest700` — новых гарнитур/цветов не вводит.
 * Если роль понадобится где-то ещё — перенести в `shared/themes/ds` по запросу.
 */
export function dsItemName(color: string): TextStyle {
  return {
    fontFamily: webFallback(DS_FONT_FAMILY.onest700),
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0,
    color,
  };
}
