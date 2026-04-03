import { memo, useEffect } from 'react';
import {
  ImageBackground,
  LayoutChangeEvent,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { TextElement } from '@ui-kitten/components';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { SpreadContext } from 'entities/Spread';
import Animated from 'react-native-reanimated';
import { DeckStyle, TarotCardDirection } from 'shared/api';
import { SCHEME_CARD_SIZE } from 'shared/constants';
import { useData } from 'shared/DataProvider';
import { useRotateAnimation } from 'shared/hooks';
import { getImage } from 'shared/lib';
import { COLORS } from 'shared/themes';
import { TSchemeCardSize } from 'shared/types';
import { Text, TEXT_TAGS } from 'shared/ui';
import { SchemeContext } from '../../model';

type TarotSchemeCardProps = {
  content: TextElement | string | number;
  forceHasImage?: boolean;
  hasRotation?: boolean;
  isHorizontal?: boolean;
  cardSize?: TSchemeCardSize;
  style?: ViewStyle;
  onLayout?: (event: LayoutChangeEvent) => void;
};

function TarotSchemeCard({
  forceHasImage,
  content,
  isHorizontal,
  hasRotation,
  cardSize,
  onLayout,
  style,
}: TarotSchemeCardProps) {
  const { hasRotation: hasRotationContext, isChoicePage } = useData({
    Context: SchemeContext,
  });

  const { appearance } = useData({ Context: ApplicationConfigContext });

  const { spread } = useData({ Context: SpreadContext });

  const { backAnimatedStyle, frontAnimatedStyle, flip } = useRotateAnimation();

  const hasCardRotation = hasRotation ?? hasRotationContext;

  const indexCard = typeof content === 'number' ? content - 1 : 0;

  useEffect(() => {
    if (!hasCardRotation) {
      return;
    }

    const timeout = typeof content === 'number' ? 200 + content * 50 : 200;

    setTimeout(() => {
      flip();
    }, timeout);
    // eslint-disable-next-line
  }, []);

  return (
    <View
      style={[
        styles.container,
        { ...(cardSize ?? SCHEME_CARD_SIZE) },
        style,
        isHorizontal ? styles.horizontal : null,
      ]}
      onLayout={onLayout}
    >
      <Animated.View
        style={[
          styles.card,
          hasCardRotation ? frontAnimatedStyle : backAnimatedStyle,
        ]}
      >
        {(forceHasImage || isChoicePage) &&
        !!spread?.selectedCards[indexCard] ? (
          <ImageBackground
            style={[
              styles.backImage,
              {
                transform:
                  spread?.selectedCards[indexCard]?.direction ===
                  TarotCardDirection.Reversed
                    ? [{ rotate: '180deg' }]
                    : [],
              },
            ]}
            source={getImage([
              'tarotCards',
              appearance?.deckStyle ?? DeckStyle.FlatIllustration,
              `card${spread?.selectedCards[indexCard].id}`,
            ])}
          />
        ) : (
          <Text
            category={TEXT_TAGS.h3}
            style={{
              ...styles.text,
              ...(isHorizontal ? styles.horizontalText : {}),
            }}
          >
            {String(content)}
          </Text>
        )}
      </Animated.View>
      <Animated.View
        style={[
          styles.card,
          hasCardRotation ? backAnimatedStyle : frontAnimatedStyle,
        ]}
      >
        <ImageBackground
          style={styles.backImage}
          source={getImage(['core', `cardBack`])}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.Background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.Content,
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    backfaceVisibility: 'hidden',
    position: 'absolute',
    overflow: 'hidden',
    width: '100%',
    height: '100%',
  },
  container: {
    position: 'relative',
  },
  text: {
    color: COLORS.Content,
  },
  horizontal: {
    transform: [{ rotate: '90deg' }],
  },
  horizontalText: {
    transform: [{ rotate: '-90deg' }],
  },
  backImage: {
    width: '100%',
    height: '100%',
  },
});

export default memo(TarotSchemeCard);
