import { StyleSheet, StyleProp } from 'react-native';
import { TextStyle } from 'react-native/Libraries/StyleSheet/StyleSheetTypes';
import { moderateScale } from 'shared/lib';
import { TEXT_TAGS, TEXT_WEIGHT } from './constants';

const fontFamilyMap: Record<string, string> = {
  regular: 'Montserrat-Regular',
  bold: 'Montserrat-Bold',
  italic: 'Montserrat-Italic',
  extraBold: 'Montserrat-ExtraBold',
  light: 'Montserrat-Light',
  medium: 'Montserrat-Medium',
  semiBold: 'Montserrat-SemiBold',
  thin: 'Montserrat-Thin',
};

const DEFAULT_TEXT_WEIGHTS = {
  [TEXT_TAGS.h1]: TEXT_WEIGHT.bold,
  [TEXT_TAGS.h2]: TEXT_WEIGHT.semibold,
  [TEXT_TAGS.h3]: TEXT_WEIGHT.medium,
  [TEXT_TAGS.h4]: TEXT_WEIGHT.regular,
  [TEXT_TAGS.h5]: TEXT_WEIGHT.regular,
  [TEXT_TAGS.p1]: TEXT_WEIGHT.regular,
  [TEXT_TAGS.label]: TEXT_WEIGHT.regular,
};

const DEFAULT_TEXT_SIZES = {
  [TEXT_TAGS.h1]: 32,
  [TEXT_TAGS.h2]: 26,
  [TEXT_TAGS.h3]: 21,
  [TEXT_TAGS.h4]: 16,
  [TEXT_TAGS.h5]: 12,
  [TEXT_TAGS.p1]: 16,
  [TEXT_TAGS.label]: 14,
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
  // StyleSheet.flatten handles arrays → plain object to avoid spreading
  // an array (which would create numeric keys like {0: style1, 1: style2}
  // and crash React DOM with "Indexed property setter is not supported")
  let textStyle: Record<string, unknown> = (StyleSheet.flatten(style as any) as Record<string, unknown>) || {};

  // делаем это из-за ошибки в деве про immutable obj
  textStyle = {
    ...textStyle,
    fontFamily: fontFamilyMap[weight || DEFAULT_TEXT_WEIGHTS[category!]],
  };

  textStyle = {
    ...textStyle,
    fontSize: moderateScale((textStyle.fontSize as number) || DEFAULT_TEXT_SIZES[category!]),
  };

  textStyle = {
    ...textStyle,
    fontWeight: (textStyle.fontWeight as string) || TEXT_WEIGHT[weight!],
  };

  return textStyle;
}
