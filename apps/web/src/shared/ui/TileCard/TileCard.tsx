import { memo } from 'react';
import {
  Image,
  ImageBackground,
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
  const { width: winW } = useWindowDimensions();
  const lockIconSize = Math.round(Math.min(40, Math.max(28, winW * 0.07)));

  // Обработчик нажатия
  const handlePress = () => {
    if (onPress) {
      onPress();

      return;
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Layout style={StyleSheet.flatten([{ width, backgroundColor: 'transparent' }])}>
        <Layout
          style={StyleSheet.flatten([
            styles.container,
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
            <View style={styles.container}>
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
                  styles.cornerImage,
                  { width: imageWidth, height: imageHeight },
                  {
                    right: imageOffsetX,
                    bottom: imageOffsetY,
                  },
                ]}
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
    </TouchableOpacity>
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
});

export default memo(TileCard);
