import { memo } from 'react';
import {
  Image,
  ImageBackground,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Layout, StyleService } from '@ui-kitten/components';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { ImagePosition, TextPosition, TileCardProps } from 'shared/types';
import { OverlayIcon } from '../OverlayIcon';
import { Text, TEXT_TAGS } from '../Text';
import { LockIcon } from '../../icons';
import { WEB_HOVER_TRANSITION } from 'shared/lib';
import { COLORS, getColorOpacity } from '../../themes';

// Иконка замка для заблокированного состояния

function TileCard({
  gradient,
  width = '100%',
  height = 180,
  children,
  imageSource,
  isLocked = false,
  onPress,
  fontWeight,
  hasOutline,
  imagePosition = ImagePosition.Background,
  imageOffsetX = 0,
  imageOffsetY = 0,
  iconProps,
  textPosition = TextPosition.Inner,
  imageWidth = 50,
  imageHeight = 70,
  textViewStyles,
  disabled,
  isSelected,
  textStyles,
  titleNumberOfLines,
  titleEllipsizeMode,
  imageResizeMode,
  subtitle,
  subtitleStyle,
  accessibilityLabel,
  imageOnly = false,
}: TileCardProps) {
  const { t } = useTranslation();
  const { width: winW } = useWindowDimensions();
  const lockIconSize = Math.round(Math.min(40, Math.max(28, winW * 0.07)));

  // Обработчик нажатия
  const handlePress = () => {
    if (onPress) {
      onPress();

      return;
    }
  };

  const accessibilityLabelComputed =
    accessibilityLabel ??
    (typeof children === 'string'
      ? subtitle
        ? `${t(children)}. ${subtitle ? t(subtitle) : ''}`
        : t(children)
      : undefined);

  const subtitleOutsideCard =
    Boolean(subtitle) && imagePosition !== ImagePosition.Corner;

  const cardTree = (
      <Layout style={StyleSheet.flatten([{ width, backgroundColor: 'transparent' }])}>
        <Layout
          style={StyleSheet.flatten([
            styles.container,
            imagePosition === ImagePosition.Corner ? styles.containerSurface : null,
            { width, height },
            !!hasOutline && styles.outlined,
            !!isSelected && styles.selected,
          ])}
        >
          {/* Изображение как фон или в углу */}
          {imagePosition === ImagePosition.Background ? (
            <ImageBackground
              source={imageSource}
              style={styles.backgroundImage}
              resizeMode={imageResizeMode ?? 'stretch'}
            >
              {/* Контент поверх фона */}

              {textPosition === TextPosition.Inner &&
                (typeof children === 'string' ? (
                  <View style={[styles.textView, textViewStyles]}>
                    {!!gradient && (
                      <LinearGradient
                        colors={gradient}
                        style={StyleSheet.absoluteFill}
                      />
                    )}
                    <Text
                      style={[styles.text, textStyles]}
                      category={TEXT_TAGS.h4}
                      weight={fontWeight}
                    >
                      {t(children)}
                    </Text>
                  </View>
                ) : (
                  children
                ))}
            </ImageBackground>
          ) : (
            <View
              style={[
                styles.cornerInner,
                imageOnly && styles.cornerInnerImageOnly,
              ]}
            >
              {!!gradient && (
                <LinearGradient
                  colors={gradient}
                  style={StyleSheet.absoluteFill}
                />
              )}
              <Image
                source={imageSource}
                resizeMode="contain"
                style={[
                  imageOnly ? styles.cornerImageCentered : styles.cornerImage,
                  { width: imageWidth, height: imageHeight },
                  imageOnly
                    ? null
                    : {
                        right: imageOffsetX,
                        bottom: imageOffsetY,
                      },
                ]}
              />
              {!imageOnly &&
                textPosition === TextPosition.Inner &&
                (typeof children === 'string' ? (
                  <View style={[styles.cornerTextBlock, textViewStyles]}>
                    <Text
                      category={TEXT_TAGS.h4}
                      style={[styles.cornerTitleText, textStyles]}
                      weight={fontWeight}
                      numberOfLines={
                        titleNumberOfLines ?? (subtitle ? 3 : 5)
                      }
                      ellipsizeMode={titleEllipsizeMode}
                    >
                      {t(children)}
                    </Text>
                    {subtitle ? (
                      <Text
                        category={TEXT_TAGS.p2}
                        style={[styles.cornerSubtitleText, subtitleStyle]}
                        numberOfLines={2}
                        ellipsizeMode="tail"
                      >
                        {subtitle ? t(subtitle) : null}
                      </Text>
                    ) : null}
                  </View>
                ) : (
                  children
                ))}
            </View>
          )}

          {/* Эффект "блюра" через View с черным цветом и прозрачностью для заблокированного состояния */}
          {isLocked && (
            <OverlayIcon>
              <LockIcon
                width={lockIconSize}
                height={lockIconSize}
                fill={COLORS.Content}
                style={{
                  width: lockIconSize + 8,
                  height: lockIconSize + 8,
                }}
                {...iconProps}
              />
            </OverlayIcon>
          )}
        </Layout>

        {textPosition === TextPosition.Outer &&
          (typeof children === 'string' ? (
            <View style={[styles.outerTitleContainer, textViewStyles]}>
              <Text
                style={[styles.outerTitle, textStyles]}
                category={TEXT_TAGS.h5}
                weight={fontWeight}
              >
                {t(children)}
              </Text>
            </View>
          ) : (
            children
          ))}
      </Layout>
  );

  const content = subtitleOutsideCard ? (
    <View style={{ width }}>
      {cardTree}
      <Text
        category={TEXT_TAGS.p2}
        style={[styles.tileSubtitle, subtitleStyle]}
      >
        {t(subtitle!)}
      </Text>
    </View>
  ) : (
    cardTree
  );

  if (disabled) {
    return (
      <View
        pointerEvents="none"
        accessibilityLabel={accessibilityLabelComputed}
      >
        {content}
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabelComputed}
      style={Platform.OS === 'web' ? styles.webPressable : undefined}
    >
      {content}
    </TouchableOpacity>
  );
}

// Темированные стили с UI Kitten
const styles = StyleService.create({
  containerSurface:
    Platform.OS === 'web'
      ? ({
          boxShadow: '0 6px 22px rgba(0, 0, 0, 0.32)',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.07)',
        } as object)
      : {
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: 'rgba(255, 255, 255, 0.08)',
        },
  cornerInner: {
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 18,
    backgroundColor: COLORS.SpbSky4,
  },
  cornerInnerImageOnly: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cornerImageCentered: {
    position: 'relative',
    zIndex: 2,
  },
  cornerTextBlock: {
    position: 'absolute',
    top: 13,
    left: 13,
    zIndex: 5,
    /** Колонка только над левой зоной — арт справа не пересекается */
    maxWidth: '46%',
    paddingRight: 4,
  },
  cornerTitleText: {
    color: COLORS.Content,
    textAlign: 'left',
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  cornerSubtitleText: {
    marginTop: 6,
    color: 'rgba(232, 239, 252, 0.85)',
    textAlign: 'left',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  textView: {
    maxWidth: '80%',
    paddingHorizontal: 8,
    paddingTop: 4,
    backgroundColor: getColorOpacity(COLORS.SpbSky4, 85),
    borderTopRightRadius: 16,
  },
  text: {},
  container: {
    borderRadius: 18,
    position: 'relative',
    overflow: 'hidden',
    height: '100%',
    backgroundColor: 'color-background-800',
  },
  outerTitleContainer: {
    display: 'flex',
    marginLeft: 'auto',
    marginRight: 'auto',
    marginTop: 8,
  },
  outerTitle: {
    maxWidth: 75,
    textAlign: 'center',
  },
  backgroundImage: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    backgroundColor: COLORS.SpbSky4,
  },
  cornerImage: {
    position: 'absolute',
    zIndex: 2,
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    opacity: 0.3,
  },
  lockOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    ...StyleSheet.absoluteFillObject,
  },
  lockWrapper: {
    backgroundColor: COLORS.SpbSky3,
    justifyContent: 'center',
    alignItems: 'center',
    width: 50,
    height: 50,
    borderRadius: 50,
  },
  outlined: {
    borderWidth: 1,
    borderColor: 'color-basic-100',
  },
  selected: {
    borderWidth: 2,
    borderColor: getColorOpacity(COLORS.Primary, 60),
  },
  tileSubtitle: {
    marginTop: 12,
    paddingHorizontal: 4,
    fontSize: 17,
    lineHeight: 22,
    color: 'rgba(216, 228, 247, 0.78)',
    letterSpacing: 0.15,
  },
  webPressable: {
    cursor: 'pointer',
    ...WEB_HOVER_TRANSITION,
  } as object,
});

export default memo(TileCard);
