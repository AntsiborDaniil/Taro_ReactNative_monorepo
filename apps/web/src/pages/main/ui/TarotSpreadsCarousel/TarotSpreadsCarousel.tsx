import React, { ReactNode } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { StyleService, useStyleSheet } from '@ui-kitten/components';
import { SmallSpreadCard } from 'features/cards';
import { TSpread } from 'shared/api';
import { ChevronRightIcon } from 'shared/icons';
import { useNativeNavigation } from 'shared/hooks';
import { AnalyticAction, NavigationRoute, TabRoute } from 'shared/types';
import { Carousel, Text, TEXT_TAGS, TEXT_WEIGHT } from 'shared/ui';

type TarotSpreadsCarouselProps = {
  title: ReactNode;
  spaceBetween?: number;
  spreads?: TSpread[];
  analyticAction?: AnalyticAction;
};

function TarotSpreadsCarousel({
  title,
  spaceBetween,
  spreads,
  analyticAction,
}: TarotSpreadsCarouselProps) {
  const styles = useStyleSheet(cardCarouselStyles);
  const navigation = useNativeNavigation();

  const handleNavigateToSpreads = () => {
    navigation.navigate(TabRoute.MainTab, {
      screen: NavigationRoute.Spreads,
    });
  };

  return (
    <View style={styles.container}>
      {typeof title === 'string' ? (
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.titleWrapper}
          onPress={handleNavigateToSpreads}
        >
          <Text
            style={styles.title}
            category={TEXT_TAGS.h2}
            weight={TEXT_WEIGHT.medium}
          >
            {title}
          </Text>
          <ChevronRightIcon width={24} height={24} />
        </TouchableOpacity>
      ) : (
        <View>{title}</View>
      )}

      {!!spreads?.length && (
        <Carousel<TSpread>
          data={spreads}
          spaceBetween={spaceBetween ?? 16}
          renderItem={({ item }) => (
            <SmallSpreadCard analyticAction={analyticAction} spread={item} />
          )}
        />
      )}
    </View>
  );
}

export default TarotSpreadsCarousel;

const cardCarouselStyles = StyleService.create({
  container: {
    flex: 1,
    gap: 24,
    display: 'flex',
  },
  titleWrapper: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    flex: 1,
  },
});
