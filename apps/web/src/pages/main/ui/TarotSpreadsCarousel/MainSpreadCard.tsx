import { memo } from 'react';
import { Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { DeckStyle, TSpread } from 'shared/api';
import { getImage } from 'shared/lib';
import { AnalyticAction } from 'shared/types';
import {
  DS_COLORS,
  DS_MOTION,
  DS_SPACE,
  dsFocusRing,
  dsRadius,
  dsText,
  dsWebTransition,
  dsWebTransitionReduced,
  getDsViewport,
} from 'shared/themes/ds';
import { useReducedMotion } from 'react-native-reanimated';
import { dsItemName, SPREAD_CARD_WIDTH } from 'pages/main/lib/dsExtra';
import { useKeyboardFocusVisible } from 'pages/main/lib/useKeyboardFocusVisible';
import { useOpenSpread } from './useOpenSpread';

type MainSpreadCardProps = {
  spread: TSpread;
  analyticAction?: AnalyticAction;
};

function MainSpreadCard({ spread, analyticAction }: MainSpreadCardProps) {
  const { t } = useTranslation();
  const { width: winW } = useWindowDimensions();
  const viewport = getDsViewport(winW);
  const reducedMotion = useReducedMotion();
  const { focusVisible, onFocus, onBlur } = useKeyboardFocusVisible();
  const { onPress } = useOpenSpread(spread, analyticAction);

  const cardWidth = SPREAD_CARD_WIDTH[viewport];
  // «Окно»/тайл §07: радиус 4% ширины (не 9% — та формула для оправы карты).
  const imageRadius = dsRadius.window(cardWidth);

  const name = t(spread.name);
  const cardsLabel = t('main:spreadCardsCount', { count: spread.cardsCount });
  const a11yLabel = t('main:spreadCard.a11y', { name, cards: cardsLabel });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      onPress={() => {
        void onPress();
      }}
      onFocus={onFocus}
      onBlur={onBlur}
      style={({ pressed }: { pressed: boolean }) => [
        styles.card,
        { width: cardWidth },
        pressed ? { transform: [{ translateY: DS_MOTION.pressShiftY }] } : null,
        focusVisible && dsFocusRing,
      ]}
    >
      {({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => (
        <>
          <View
            style={[
              styles.imageFrame,
              {
                width: cardWidth,
                height: cardWidth,
                borderRadius: imageRadius,
                borderColor: hovered ? DS_COLORS.accent400 : DS_COLORS.ground600,
              },
              reducedMotion ? dsWebTransitionReduced : dsWebTransition,
            ]}
          >
            <Image
              source={getImage(['spreadsSmall', DeckStyle.FlatIllustration, `${spread.id}`])}
              resizeMode="cover"
              style={{ position: 'absolute', top: 0, left: 0, width: cardWidth, height: cardWidth }}
              accessible={false}
              importantForAccessibility="no"
            />
            {pressed ? (
              <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.pressOverlay]} />
            ) : null}
          </View>
          <View style={styles.textCol}>
            <Text numberOfLines={2} style={dsItemName(DS_COLORS.ink50)}>
              {name}
            </Text>
            <Text numberOfLines={1} style={dsText('micro', DS_COLORS.ink100)}>
              {cardsLabel}
            </Text>
          </View>
        </>
      )}
    </Pressable>
  );
}

export default memo(MainSpreadCard);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'column',
    gap: DS_SPACE.s,
  },
  imageFrame: {
    overflow: 'hidden',
    borderWidth: 1,
    backgroundColor: DS_COLORS.ground700,
    position: 'relative',
  },
  textCol: {
    gap: 2,
  },
  pressOverlay: {
    backgroundColor: DS_COLORS.pressDim,
  },
});
