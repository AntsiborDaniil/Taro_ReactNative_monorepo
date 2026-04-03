import React, { forwardRef, Ref, useCallback, useRef } from 'react';
import { Animated, ListRenderItem, StyleSheet, View } from 'react-native';
import { FlatList, GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  DEFAULT_DECELERATION_RATE,
  DEFAULT_SCROLL_EVENT_THROTTLE,
} from './constants';
import { CarouselProps, ForwardRefCarousel } from './types';

const Carousel = forwardRef(
  <T,>(props: CarouselProps<T>, ref: Ref<FlatList<T>>) => {
    const scrollX = useRef(new Animated.Value(0)).current;

    const {
      data,
      renderItem,
      decelerationRate,
      itemWidth,
      spaceBetween,
      outerCarouselRef,
      carouselWidth,
      renderItemStyle,
      ...restProps
    } = props ?? {};

    const renderDefaultRenderItem = (
      info: Parameters<ListRenderItem<T>>[0]
    ) => (
      <View
        key={info.index}
        style={[
          styles.renderItem,
          {
            paddingLeft: info.index === 0 ? 16 : 0,
            paddingRight:
              data?.length && info.index === data.length - 1 ? 16 : 0,
            maxWidth: itemWidth ?? '100%',
          },
          renderItemStyle,
        ]}
      >
        {renderItem(info)}
      </View>
    );

    const handleScroll = useCallback(() => {
      Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
        useNativeDriver: false,
      });
    }, [scrollX]);

    return (
      <GestureHandlerRootView style={styles.container}>
        <Animated.View style={[styles.container, { maxWidth: carouselWidth }]}>
          <FlatList
            ref={ref}
            data={data}
            renderItem={renderDefaultRenderItem}
            contentContainerStyle={{
              gap: spaceBetween,
            }}
            horizontal
            bounces={false}
            simultaneousHandlers={
              outerCarouselRef ? [outerCarouselRef] : undefined
            }
            scrollEventThrottle={DEFAULT_SCROLL_EVENT_THROTTLE}
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, index) => index.toString()}
            decelerationRate={decelerationRate ?? DEFAULT_DECELERATION_RATE}
            onScroll={handleScroll}
            {...restProps}
          />
        </Animated.View>
      </GestureHandlerRootView>
    );
  }
) as ForwardRefCarousel;

Carousel.displayName = 'Carousel';

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  renderItem: {
    width: 'auto',
  },
});

export default Carousel;
