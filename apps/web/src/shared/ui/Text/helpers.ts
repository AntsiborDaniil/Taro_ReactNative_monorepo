import { StyleProp, StyleSheet } from 'react-native';
import { TextStyle } from 'react-native/Libraries/StyleSheet/StyleSheetTypes';
import { TYPOGRAPHY_PX_BY_TIER } from 'shared/themes/responsive-tokens';
import {
  resolveCategoryPx,
  toResponsiveFontPx,
} from 'shared/themes/typography';
import { TEXT_TAGS, TEXT_WEIGHT } from './constants';

const FONT_BY_WEIGHT: Record<
  keyof typeof TEXT_WEIGHT,
  { fontFamily: string; fontWeight: TextStyle['fontWeight'] }
> = {
  regular: { fontFamily: 'Montserrat-Regular', fontWeight: '400' },
  medium: { fontFamily: 'Montserrat-Medium', fontWeight: '500' },
  semibold: { fontFamily: 'Montserrat-SemiBold', fontWeight: '600' },
  bold: { fontFamily: 'Montserrat-Bold', fontWeight: '700' },
  extraBold: { fontFamily: 'Montserrat-ExtraBold', fontWeight: '800' },
  light: { fontFamily: 'Montserrat-Light', fontWeight: '300' },
  thin: { fontFamily: 'Montserrat-Thin', fontWeight: '200' },
  italic: { fontFamily: 'Montserrat-Italic', fontWeight: '400' },
};

const DEFAULT_TEXT_WEIGHTS: Record<keyof typeof TEXT_TAGS, keyof typeof TEXT_WEIGHT> =
  {
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
  style?: any; // Дополнительные стили
};

export function getTextStyles({
  weight,
  style,
  category,
}: TTextStylesParameters): StyleProp<TextStyle> {
  // Style может быть массивом; spread массива даёт ключи 0,1 — на web это ломает CSSStyleDeclaration
  const base = StyleSheet.flatten(style) ?? {};

  let textStyle: TextStyle = { ...base };

  const resolvedWeight =
    weight ?? DEFAULT_TEXT_WEIGHTS[category ?? TEXT_TAGS.p1];
  const font = FONT_BY_WEIGHT[resolvedWeight];

  textStyle = {
    ...textStyle,
    fontFamily: font.fontFamily,
    fontWeight: base.fontWeight ?? font.fontWeight,
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

  // lineHeight в StyleSheet часто задаётся через moderateScale при импорте модуля,
  // а fontSize пересчитывается на каждый рендер — на web это даёт огромные межстрочные отступы.
  if (typeof base.lineHeight === 'number' && resolvedFontSize > 0) {
    const bodyLineHeightRatio =
      24 / TYPOGRAPHY_PX_BY_TIER.laptop.body;
    const ratio =
      typeof explicitSize === 'number' && explicitSize > 0
        ? base.lineHeight / explicitSize
        : bodyLineHeightRatio;

    textStyle.lineHeight = Math.round(resolvedFontSize * ratio);
  }

  return textStyle;
}
