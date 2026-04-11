import { useEffect, useRef } from 'react';
import {
  Animated,
  DimensionValue,
  ImageBackground,
  Platform,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { StyleProp } from 'react-native/Libraries/StyleSheet/StyleSheet';
import { DeckStyle, TarotCardDirection } from 'shared/api';
import { useData } from 'shared/DataProvider';
import { Checked, LockIcon } from 'shared/icons';
import { getImage } from 'shared/lib';
import { COLORS } from 'shared/themes';
import { OverlayIcon } from '../OverlayIcon';

type TarotCardProps = {
  cardId: string;
  isSelected?: boolean;
  isLocked?: boolean;
  customAppearance?: DeckStyle;
  styleCard?: StyleProp<ViewStyle>;
  width?: DimensionValue;
  height?: DimensionValue;
  direction?: TarotCardDirection;
};

function TarotCard({
  cardId,
  width,
  isSelected,
  isLocked,
  height,
  customAppearance,
  styleCard,
  direction = TarotCardDirection.Upright,
}: TarotCardProps) {
  const { appearance } = useData({ Context: ApplicationConfigContext });

  const borderColorAnim = useRef(
    new Animated.Value(isSelected ? 1 : 0)
  ).current;
  const iconOpacityAnim = useRef(
    new Animated.Value(isSelected ? 1 : 0)
  ).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(borderColorAnim, {
        toValue: isSelected ? 1 : 0,
        duration: 250,
        useNativeDriver: false,
      }),
      Animated.timing(iconOpacityAnim, {
        toValue: isSelected ? 1 : 0,
        duration: 250,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  }, [borderColorAnim, iconOpacityAnim, isSelected]);

  const animatedBorderColor = borderColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.Content, COLORS.Accent],
  });

  return (
    <Animated.View
      style={[
        styles.card,
        {
          transform:
            direction === TarotCardDirection.Reversed
              ? [{ rotate: '180deg' }]
              : [],
          borderColor: animatedBorderColor,
        },
        styleCard,
      ]}
    >
      <ImageBackground
        source={getImage([
          'tarotCards',
          customAppearance ??
            appearance?.deckStyle ??
            DeckStyle.FlatIllustration,
          `card${cardId}`,
        ])}
        resizeMode="cover"
        style={[styles.imageBackground, { width, height }]}
      >
        {!!isSelected && (
          <Animated.View
            style={{
              opacity: iconOpacityAnim,
              flex: 1,
              ...StyleSheet.absoluteFillObject,
            }}
          >
            <OverlayIcon
              type="bottom"
              size="s"
              wrapperStyles={styles.iconWrapper}
            >
              <Checked width={16} height={16} />
            </OverlayIcon>
          </Animated.View>
        )}
      </ImageBackground>
      {isLocked && (
        <OverlayIcon>
          <LockIcon width={36} height={36} fill={COLORS.Content} />
        </OverlayIcon>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    borderStyle: 'solid',
    borderWidth: 1,
  },
  imageBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    objectFit: 'cover',
    aspectRatio: 9 / 16,
    width: null,
    height: null,
    padding: 16,
  },
  iconWrapper: {
    backgroundColor: COLORS.Accent,
  },
});

export default TarotCard;
