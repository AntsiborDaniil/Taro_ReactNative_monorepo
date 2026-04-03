import React from 'react';
import { StyleSheet } from 'react-native';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { SpreadContext } from 'entities/Spread';
import Animated from 'react-native-reanimated';
import { DeckStyle, TarotCardDirection } from 'shared/api';
import { SLIDER_CARD_SIZE } from 'shared/constants';
import { useData } from 'shared/DataProvider';
import { getImage } from 'shared/lib';
import { AnimationCarouselContext } from '../model';

function AnimatedCard() {
  const { animatedStyle, backAnimatedStyle, frontAnimatedStyle } = useData({
    Context: AnimationCarouselContext,
  });

  const { appearance } = useData({ Context: ApplicationConfigContext });

  const { preSelectedTarotCard } = useData({ Context: SpreadContext });

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Animated.View style={[styles.card, backAnimatedStyle]}>
        <Animated.Image
          style={styles.image}
          source={getImage(['core', 'cardBack'])}
          resizeMode="cover"
        />
      </Animated.View>
      <Animated.View style={[styles.card, frontAnimatedStyle]}>
        <Animated.Image
          style={[
            styles.image,
            {
              transform:
                preSelectedTarotCard?.direction === TarotCardDirection.Reversed
                  ? [{ rotate: '180deg' }]
                  : [],
            },
          ]}
          source={getImage([
            'tarotCards',
            appearance?.deckStyle ?? DeckStyle.FlatIllustration,
            `card${preSelectedTarotCard?.id}`,
          ])}
          resizeMode="cover"
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...SLIDER_CARD_SIZE,
    position: 'absolute',
  },
  card: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    backfaceVisibility: 'hidden',
    zIndex: -1,
  },
  image: {
    width: '100%',
    height: '100%',
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: 12,
  },
});

export default AnimatedCard;
