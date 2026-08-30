import React from 'react';
import { StyleSheet } from 'react-native';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { SpreadContext } from 'entities/Spread';
import Animated from 'react-native-reanimated';
import { DeckStyle, TarotCardDirection } from 'shared/api';
import { useData } from 'shared/DataProvider';
import { getImage } from 'shared/lib';
import { COLORS } from 'shared/themes';
import { AnimationCarouselContext } from '../model';

function AnimatedCard() {
  const { animatedStyle, backAnimatedStyle, frontAnimatedStyle, flyingCardSize } =
    useData({
      Context: AnimationCarouselContext,
    });

  const { appearance } = useData({ Context: ApplicationConfigContext });

  const { preSelectedTarotCard } = useData({ Context: SpreadContext });

  const cardSize = flyingCardSize ?? { width: 160, height: 288 };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: cardSize.width,
          height: cardSize.height,
        },
        animatedStyle,
      ]}
      pointerEvents="none"
    >
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
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 120,
  },
  card: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    backfaceVisibility: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    borderWidth: 2,
    borderColor: COLORS.Content,
    borderRadius: 14,
    ...({
      boxShadow: '0 22px 48px rgba(0,0,0,0.45)',
    } as object),
  },
});

export default AnimatedCard;
