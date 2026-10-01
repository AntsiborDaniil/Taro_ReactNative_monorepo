import { Platform, StyleProp, StyleSheet } from 'react-native';
import { TextStyle } from 'react-native/Libraries/StyleSheet/StyleSheetTypes';
import { TYPOGRAPHY_PX_BY_TIER } from 'shared/themes/responsive-tokens';
import {
  resolveCategoryPx,
  toResponsiveFontPx,
} from 'shared/themes/typography';
import { TEXT_TAGS, TEXT_WEIGHT } from './constants';

/**
 * DS §06: Onest — lead/body/label/micro/button/chip. Один файл = одно начертание,
 * без fontWeight в стилях (иначе браузер синтезирует жирность поверх реального шрифта).
 * Зарегистрированы только Medium/SemiBold/Bold/ExtraBold (см. appFonts.ts) — более лёгкие
 * и курсивные веса сведены к Medium.
 */
const webFallback = (family: string) =>
  Platform.OS === 'web' ? `'${family}', system-ui, sans-serif` : family;

const FONT_BY_WEIGHT: Record<keyof typeof TEXT_WEIGHT, { fontFamily: string }> = {
  regular: { fontFamily: webFallback('Onest-Medium') },
  medium: { fontFamily: webFallback('Onest-Medium') },
  semibold: { fontFamily: webFallback('Onest-SemiBold') },
  bold: { fontFamily: webFallback('Onest-Bold') },
  extraBold: { fontFamily: webFallback('Onest-ExtraBold') },
  light: { fontFamily: webFallback('Onest-Medium') },
  thin: { fontFamily: webFallback('Onest-Medium') },
  italic: { fontFamily: webFallback('Onest-Medium') },
};

/** Заголовки категорий — Geologica (дисплей DS §06), а не Onest. */
const CATEGORY_GEOLOGICA_FAMILY: Partial<Record<keyof typeof TEXT_TAGS, string>> = {
  h1: webFallback('Geologica-Black'),
  h2: webFallback('Geologica-ExtraBold'),
  h3: webFallback('Geologica-ExtraBold'),
};

const DEFAULT_TEXT_WEIGHTS: Record<
  keyof typeof TEXT_TAGS,
  keyof typeof TEXT_WEIGHT
> = {
  [TEXT_TAGS.h1]: TEXT_WEIGHT.semibold,
  [TEXT_TAGS.h2]: TEXT_WEIGHT.medium,
  [TEXT_TAGS.h3]: TEXT_WEIGHT.regular,
  [TEXT_TAGS.h4]: TEXT_WEIGHT.regular,
  [TEXT_TAGS.h5]: TEXT_WEIGHT.regular,
  [TEXT_TAGS.p1]: TEXT_WEIGHT.regular,
  [TEXT_TAGS.p2]: TEXT_WEIGHT.regular,
  [TEXT_TAGS.label]: TEXT_WEIGHT.regular,
};

type TTextStylesParameters = {
  category?: keyof typeof TEXT_TAGS;
  weight?: keyof typeof TEXT_WEIGHT;
  style?: any;
};

export function getTextStyles({
  weight,
  style,
  category,
}: TTextStylesParameters): StyleProp<TextStyle> {
  const base = StyleSheet.flatten(style) ?? {};

  let textStyle: TextStyle = { ...base };

  const resolvedWeight =
    weight ?? DEFAULT_TEXT_WEIGHTS[category ?? TEXT_TAGS.p1];
  const geologicaFamily = category ? CATEGORY_GEOLOGICA_FAMILY[category] : undefined;
  const fontFamily = geologicaFamily ?? FONT_BY_WEIGHT[resolvedWeight].fontFamily;

  textStyle = {
    ...textStyle,
    fontFamily,
    fontWeight: undefined,
  };

  const defaultSize = resolveCategoryPx(category!);
  const explicitSize = base.fontSize;
  const resolvedFontSize =
    typeof explicitSize === 'number' && !Number.isNaN(explicitSize)
      ? explicitSize
      : toResponsiveFontPx(defaultSize);

  textStyle = {
    ...textStyle,
    fontSize: resolvedFontSize,
  };

  if (typeof base.lineHeight === 'number' && resolvedFontSize > 0) {
    const bodyLineHeightRatio = 24 / TYPOGRAPHY_PX_BY_TIER.laptop.body;
    const ratio =
      typeof explicitSize === 'number' && explicitSize > 0
        ? base.lineHeight / explicitSize
        : bodyLineHeightRatio;

    textStyle.lineHeight = Math.round(resolvedFontSize * ratio);
  }

  return textStyle;
}
