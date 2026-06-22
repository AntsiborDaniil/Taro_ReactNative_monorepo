import { useEffect, useRef } from 'react';
import {
  Animated,
  DimensionValue,
  ImageBackground,
  ImageResizeMode,
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
  imageResizeMode?: ImageResizeMode;
  direction?: TarotCardDirection;
  pointerEvents?: 'auto' | 'none' | 'box-none' | 'box-only';
};

function TarotCard({
  cardId,
  width,
  isSelected,
  isLocked,
  height,
  imageResizeMode = 'cover',
  customAppearance,
  styleCard,
  direction = TarotCardDirection.Upright,
  pointerEvents = 'auto',
}: TarotCardProps) {
  const { appearance } = useData({ Context: ApplicationConfigContext });
  const selectedAppearance =
    customAppearance ?? appearance?.deckStyle ?? DeckStyle.FlatIllustration;
  const imageSource =
    getImage(['tarotCards', selectedAppearance, `card${cardId}`]) ||
    getImage(['tarotCards', DeckStyle.FlatIllustration, `card${cardId}`]) ||
    getImage(['core', 'cardBack']);

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

  const hasExplicitSize =
    typeof width === 'number' &&
    typeof height === 'number' &&
    width > 0 &&
    height > 0;

  const imagePadding =
    imageResizeMode === 'contain' ? 0 : hasExplicitSize ? 0 : 12;

  const imageInnerWebStyle =
    hasExplicitSize && Platform.OS === 'web'
      ? ({
          flexGrow: 0,
          flexShrink: 0,
          flexBasis: 'auto',
          width: '100%',
          height: '100%',
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: imageResizeMode === 'contain' ? 'contain' : 'cover',
          imageRendering: 'auto',
        } as object)
      : undefined;

  return (
    <Animated.View
      pointerEvents={pointerEvents}
      style={[
        styles.card,
        hasExplicitSize ? styles.cardExplicitOuter : styles.cardFlexFill,
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
        source={imageSource}
        resizeMode={imageResizeMode}
        imageStyle={imageInnerWebStyle}
        style={
          hasExplicitSize
            ? [
                styles.imageBackgroundFixed,
                {
                  width,
                  height,
                  padding: imagePadding,
                },
              ]
            : [
                styles.imageBackground,
                {
                  width,
                  height,
                  padding: imagePadding,
                },
              ]
        }
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
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    borderStyle: 'solid',
    borderWidth: 1,
    backgroundColor: COLORS.SpbSky4,
  },
  /** Растягивание внутри flex-родителя, когда нет явных width/height */
  cardFlexFill: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
  },
  /** Фиксированный размер карты (мотивация, деталь и т.д.) — без flex-basis: 0 */
  cardExplicitOuter: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
  },
  imageBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    objectFit: 'cover',
    aspectRatio: 9 / 16,
    width: null,
    height: null,
  },
  /** Явные px-размеры: без flex:1, чтобы web не схлопывал ImageBackground */
  imageBackgroundFixed: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  iconWrapper: {
    backgroundColor: COLORS.Accent,
  },
});

export default TarotCard;
