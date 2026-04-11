import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  DimensionValue,
  ImageBackground,
  Platform,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { TSelectedTarotCard } from 'shared/api';
import { getImage } from 'shared/lib';
import { COLORS } from '../../themes'; // Ваш оригинальный компонент
import TarotCard from './TarotCard';

type FlippableTarotCardProps = {
  cards: TSelectedTarotCard[];
  currentIndex: number;
  width?: DimensionValue;
  height?: DimensionValue;
  styleCard?: StyleProp<ViewStyle>;
  onFlipComplete?: (newIndex: number) => void;
  direction?: 'forward' | 'backward' | null;
};

const FlippableTarotCard = ({
  cards,
  currentIndex,
  width,
  height,
  styleCard,
  onFlipComplete,
  direction,
}: FlippableTarotCardProps) => {
  const flipAnimation = useRef(new Animated.Value(0)).current;
  const [displayedIndex, setDisplayedIndex] = useState(currentIndex);
  const [isFlipping, setIsFlipping] = useState(false);
  const [showBack, setShowBack] = useState(true); // Изначально показываем рубашку

  // Интерполяция для анимации
  const frontInterpolate = flipAnimation.interpolate({
    inputRange: [0, 180, 360],
    outputRange: ['0deg', '180deg', '360deg'],
  });

  const backInterpolate = flipAnimation.interpolate({
    inputRange: [0, 180, 360],
    outputRange: ['180deg', '0deg', '-180deg'],
  });

  const frontAnimatedStyle = {
    transform: [{ rotateY: frontInterpolate }],
  };

  const backAnimatedStyle = {
    transform: [{ rotateY: backInterpolate }],
  };

  const animateFlip = (toIndex: number, fromBack: boolean) => {
    setIsFlipping(true);
    flipAnimation.setValue(0);
    Animated.timing(flipAnimation, {
      toValue: 360,
      duration: 1000,
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => {
      setDisplayedIndex(toIndex);
      setShowBack(fromBack ? false : true); // Переключаем между рубашкой и лицом
      setIsFlipping(false);
      onFlipComplete?.(toIndex);
    });
  };

  useEffect(() => {
    if (currentIndex !== displayedIndex && !isFlipping) {
      animateFlip(currentIndex, true); // При смене индекса показываем рубашку
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, direction]);

  const currentCard = cards[displayedIndex];

  return (
    <View style={[styles.container, styleCard]}>
      {/* Задняя сторона (рубашка) */}
      <Animated.View style={[styles.cardContainer, backAnimatedStyle]}>
        {showBack ? (
          <View style={[styles.card, styleCard]}>
            <ImageBackground
              source={getImage(['core', 'cardBack'])}
              resizeMode="cover"
              // resizeMethod="scale"
              style={[styles.imageBackground, { width, height }]}
            />
          </View>
        ) : (
          <TarotCard
            cardId={currentCard.id}
            direction={currentCard?.direction}
          />
        )}
      </Animated.View>

      {/* Передняя сторона (лицо карты или рубашка при переключении) */}
      <Animated.View style={[styles.cardContainer, frontAnimatedStyle]}>
        {!showBack ? (
          <View style={[styles.card, styleCard]}>
            <ImageBackground
              source={getImage(['core', 'cardBack'])}
              resizeMode="cover"
              // resizeMethod="scale"
              style={styles.imageBackground}
            />
          </View>
        ) : (
          <TarotCard
            cardId={currentCard.id}
            direction={currentCard?.direction}
          />
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  cardContainer: {
    flex: 1,
    position: 'absolute',

    backfaceVisibility: 'hidden',
  },
  card: {
    flex: 1,
    borderRadius: 28,
    overflow: 'hidden',
    position: 'relative',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: COLORS.Content,
  },
  imageBackground: {
    justifyContent: 'center',
    alignItems: 'center',
    aspectRatio: 9 / 16,
    padding: 16,
  },
});

export default FlippableTarotCard;
