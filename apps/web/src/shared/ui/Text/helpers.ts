import { Platform, StyleProp, StyleSheet } from 'react-native';
import { TextStyle } from 'react-native/Libraries/StyleSheet/StyleSheetTypes';
import { TYPOGRAPHY_PX_BY_TIER } from 'shared/themes/responsive-tokens';
import {
  resolveCategoryPx,
  toResponsiveFontPx,
} from 'shared/themes/typography';
import { TEXT_TAGS, TEXT_WEIGHT } from './constants';

/**
 * On web we only load Regular / Medium / SemiBold / Bold (see appFonts.ts).
 * Map other weights to a loaded face so RN Web does not fall back to system junk.
 */
const FONT_BY_WEIGHT: Record<
  keyof typeof TEXT_WEIGHT,
  { fontFamily: string; fontWeight: TextStyle['fontWeight'] }
> =
  Platform.OS === 'web'
    ? {
        regular: { fontFamily: 'Montserrat-Regular', fontWeight: '400' },
        medium: { fontFamily: 'Montserrat-Medium', fontWeight: '500' },
        semibold: { fontFamily: 'Montserrat-SemiBold', fontWeight: '600' },
        bold: { fontFamily: 'Montserrat-Bold', fontWeight: '700' },
        extraBold: { fontFamily: 'Montserrat-Bold', fontWeight: '700' },
        light: { fontFamily: 'Montserrat-Regular', fontWeight: '400' },
        thin: { fontFamily: 'Montserrat-Regular', fontWeight: '400' },
        italic: { fontFamily: 'Montserrat-Regular', fontWeight: '400' },
      }
    : {
        regular: { fontFamily: 'Montserrat-Regular', fontWeight: '400' },
        medium: { fontFamily: 'Montserrat-Medium', fontWeight: '500' },
        semibold: { fontFamily: 'Montserrat-SemiBold', fontWeight: '600' },
        bold: { fontFamily: 'Montserrat-Bold', fontWeight: '700' },
        extraBold: { fontFamily: 'Montserrat-ExtraBold', fontWeight: '800' },
        light: { fontFamily: 'Montserrat-Light', fontWeight: '300' },
        thin: { fontFamily: 'Montserrat-Thin', fontWeight: '200' },
        italic: { fontFamily: 'Montserrat-Italic', fontWeight: '400' },
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
