import React, { ReactNode } from 'react';
import { TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { StyleService, useStyleSheet } from '@ui-kitten/components';
import { SmallSpreadCard } from 'features/cards';
import { TSpread } from 'shared/api';
import { ChevronRightIcon } from 'shared/icons';
import { useNativeNavigation } from 'shared/hooks';
import { useData } from 'shared/DataProvider';
import { TabsAndRoutesContext } from 'shared/contexts/TabsAndRoutes';
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
  const { setSelectedTab } = useData({ Context: TabsAndRoutesContext });
  const { width } = useWindowDimensions();
  const isCompact = width < 430;
  const gap = spaceBetween ?? (isCompact ? 12 : 16);
  const edgePad = isCompact ? 10 : 14;

  const handleNavigateToSpreads = () => {
    setSelectedTab?.(TabRoute.SpreadsTab);
    navigation.navigate(TabRoute.SpreadsTab, {
      screen: NavigationRoute.Spreads,
    });
  };

  return (
    <View style={styles.container}>
      {typeof title === 'string' ? (
        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.titleWrapper, { paddingHorizontal: edgePad }]}
          onPress={handleNavigateToSpreads}
        >
          <Text
            style={styles.title}
            category={TEXT_TAGS.h2}
            weight={TEXT_WEIGHT.medium}
            numberOfLines={1}
          >
            {title}
          </Text>
          <ChevronRightIcon
            width={isCompact ? 20 : 24}
            height={isCompact ? 20 : 24}
          />
        </TouchableOpacity>
      ) : (
        <View>{title}</View>
      )}

      {!!spreads?.length && (
        <View style={styles.carouselClip}>
          <Carousel<TSpread>
            data={spreads}
            spaceBetween={gap}
            edgePadding={edgePad}
            style={styles.carouselList}
            renderItem={({ item }) => (
              <SmallSpreadCard analyticAction={analyticAction} spread={item} />
            )}
          />
        </View>
      )}
    </View>
  );
}

export default TarotSpreadsCarousel;

const cardCarouselStyles = StyleService.create({
  container: {
    width: '100%',
    maxWidth: '100%',
    gap: 16,
    overflow: 'hidden',
  },
  titleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    flex: 1,
    minWidth: 0,
  },
  carouselClip: {
    width: '100%',
    maxWidth: '100%',
    overflow: 'hidden',
  },
  carouselList: {
    width: '100%',
    maxWidth: '100%',
  },
});
