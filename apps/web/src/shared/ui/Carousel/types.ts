import {
  ForwardRefExoticComponent,
  ReactElement,
  Ref,
  RefAttributes,
} from 'react';
import {
  DimensionValue,
  FlatList,
  FlatListProps,
  ListRenderItem,
  ViewStyle,
} from 'react-native';
import { StyleProp } from 'react-native/Libraries/StyleSheet/StyleSheet';

export type CarouselProps<T> = {
  hasPagination?: boolean;
  isLoading?: boolean;
  outerCarouselRef?: any;
  /* Ограниченная ширина карусли */
  carouselWidth?: DimensionValue;
  /* Ограниченная ширина слайда */
  itemWidth?: number;
  /* Отступ между слайдами */
  spaceBetween?: number;
  renderItem: ListRenderItem<T>;
  renderItemStyle?: StyleProp<ViewStyle>;
} & FlatListProps<T>;

export interface ForwardRefCarousel
  extends ForwardRefExoticComponent<
    CarouselProps<unknown> & RefAttributes<FlatList<unknown>>
  > {
  <T>(props: CarouselProps<T> & { ref?: Ref<FlatList<T>> }): ReactElement;
}
