import React from 'react';
import {
  Text as KittenText,
  TextElement,
  TextProps as KittenTextProps,
} from '@ui-kitten/components';
import { StyleProp } from 'react-native/Libraries/StyleSheet/StyleSheet';
import { TextStyle } from 'react-native/Libraries/StyleSheet/StyleSheetTypes';
import { TEXT_TAGS, TEXT_WEIGHT } from './constants';
import { getTextStyles } from './helpers';

// Типы пропсов для универсального текстового компонента
export interface TextProps extends KittenTextProps {
  children: TextElement | string;
  category?: keyof typeof TEXT_TAGS;
  weight?: keyof typeof TEXT_WEIGHT;
  style?: StyleProp<TextStyle>; // Дополнительные стили
}

const Text: React.FC<TextProps> = ({
  children,
  category = TEXT_TAGS.p1,
  weight,
  style,
  ...rest
}) => {
  const textStyle = getTextStyles({ category, weight, style });

  return (
    <KittenText category={category} style={textStyle} {...rest}>
      {children}
    </KittenText>
  );
};

export default Text;
