import { ReactNode } from 'react';
import {
  DimensionValue,
  ImageResizeMode,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { IconProps } from '@ui-kitten/components/ui/icon/icon.component';
import { TEXT_WEIGHT } from '../ui';

export type TileCardProps = {
  id?: string | number;
  gradient?: readonly [string, string, ...string[]];
  width?: DimensionValue; // Ширина карточки (в пикселях или процентах)
  height?: DimensionValue; // Высота карточки (в пикселях или процентах)
  children?: ReactNode; // Текст в нижнем левом углу
  imageSource?: any; // Источник изображения (локальный или удалённый URI)
  isLocked?: boolean; // Состояние блокировки
  onPress?: () => void; // Обработчик нажатия
  hasOutline?: boolean;
  isSelected?: boolean;
  fontWeight?: keyof typeof TEXT_WEIGHT; // Жирность заголовка
  imagePosition?: ImagePosition; // Положение изображения
  imageOffsetX?: number; // Сдвиг изображения вправо (для corner)
  imageOffsetY?: number; // Сдвиг изображения вниз (для corner)
  imageWidth?: number; // Ширина изображения (для corner)
  imageHeight?: number; // Высота изображения (для corner)
  iconProps?: IconProps;
  disabled?: boolean;
  textPosition?: TextPosition; // Расположение текста внутри или снаружи контейнера;
  textStyles?: StyleProp<ViewStyle>;
  imageResizeMode?: ImageResizeMode;
  textViewStyles?: StyleProp<ViewStyle>;
};

export enum ImagePosition {
  'Background' = 'background',
  'Corner' = 'corner',
}

export enum TextPosition {
  Inner = 'inner',
  Outer = 'outer',
}
