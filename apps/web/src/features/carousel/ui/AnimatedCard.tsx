import React from 'react';
import { Platform, StyleSheet } from 'react-native';
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

  const cardSize = flyingCardSize ?? { width: 64, height: 114 };
  const borderRadius = Math.max(8, Math.round(cardSize.width * 0.14));
  const isSmall = cardSize.width < 72;

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
          style={[
            styles.image,
            {
              borderRadius,
              borderWidth: isSmall ? 1.5 : 2,
            },
          ]}
          source={getImage(['core', 'cardBack'])}
          resizeMode="cover"
        />
      </Animated.View>
      <Animated.View style={[styles.card, frontAnimatedStyle]}>
        <Animated.Image
          style={[
            styles.image,
            {
              borderRadius,
              borderWidth: isSmall ? 1.5 : 2,
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
    position: Platform.OS === 'web' ? 'fixed' : 'absolute',
    left: 0,
    top: 0,
    zIndex: Platform.OS === 'web' ? 120 : undefined,
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
    borderColor: COLORS.Content,
    ...({
      boxShadow: '0 10px 22px rgba(0,0,0,0.38)',
    } as object),
  },
});

export default AnimatedCard;
