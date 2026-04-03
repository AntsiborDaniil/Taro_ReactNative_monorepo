import { memo } from 'react';
import {
  Image,
  ImageBackground,
  ImageStyle,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Layout, StyleService } from '@ui-kitten/components';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { ImagePosition, TextPosition, TileCardProps } from 'shared/types';
// Import directly to avoid the barrel-index require cycle:
// shared/ui/index.ts → TileCard → shared/ui/index.ts
import { OverlayIcon } from '../OverlayIcon';
import { Text, TEXT_TAGS } from '../Text';
import { LockIcon } from '../../icons';
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
  imageResizeMode,
}: TileCardProps) {
  const { t } = useTranslation();

  const handlePress = () => { onPress?.(); };

  // On web, Pressable/div[role="button"] doesn't fire onClick on Enter/Space
  // natively — handle keydown ourselves.
  const handleKeyDown = Platform.OS === 'web' && onPress
    ? (e: any) => {
        const key = e?.nativeEvent?.key ?? e?.key;
        if ((key === 'Enter' || key === ' ') && !disabled) {
          e?.preventDefault?.();
          handlePress();
        }
      }
    : undefined;

  const cardLabel = typeof children === 'string' ? children : undefined;

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={isLocked ? `${cardLabel ?? ''} (locked)` : cardLabel}
      accessibilityState={{ disabled: !!disabled || isLocked }}
      // @ts-ignore – web-only
      onKeyDown={handleKeyDown}
      style={({ pressed }: any) =>
        Platform.OS === 'web' && pressed && onPress
          ? { opacity: 0.8, transform: [{ scale: 0.98 }] }
          : undefined
      }
    >
      <Layout style={[{ width, backgroundColor: 'transparent' }]}>
        <Layout
          style={[
            styles.container,
            { width, height },
            !!hasOutline && styles.outlined,
            !!isSelected && styles.selected,
          ]}
        >
          {/* Изображение как фон или в углу */}
          {imagePosition === ImagePosition.Background ? (
            <ImageBackground
              source={imageSource}
              style={styles.backgroundImage}
              resizeMode={imageResizeMode ?? 'cover'}
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
            <View style={styles.container}>
              {!!gradient && (
                <LinearGradient
                  colors={gradient}
                  style={StyleSheet.absoluteFill}
                />
              )}
              <Image
                source={imageSource}
                style={
                  [
                    styles.cornerImage,
                    { width: imageWidth, height: imageHeight },
                    {
                      right: imageOffsetX,
                      bottom: imageOffsetY,
                    },
                  ] as ImageStyle
                }
              />
              {textPosition === TextPosition.Inner &&
                (typeof children === 'string' ? (
                  <View style={textViewStyles}>
                    <Text style={textStyles} weight={fontWeight}>
                      {t(children)}
                    </Text>
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
                width={36}
                height={36}
                fill={COLORS.Content}
                style={styles.lockIcon}
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
    </Pressable>
  );
}

// Темированные стили с UI Kitten
const styles = StyleService.create({
  textView: {
    maxWidth: '80%',
    paddingHorizontal: 8,
    paddingTop: 4,
    backgroundColor: getColorOpacity(COLORS.SpbSky4, 85),
    borderTopRightRadius: 16,
  },
  text: {},
  container: {
    borderRadius: 16,
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
  },
  cornerImage: {
    position: 'absolute',
    resizeMode: 'contain',
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
  lockIcon: {
    width: 50,
    height: 50,
  },
  outlined: {
    borderWidth: 1,
    borderColor: 'color-basic-100',
  },
  selected: {
    borderWidth: 2,
    borderColor: getColorOpacity(COLORS.Primary, 60),
  },
});

export default memo(TileCard);
