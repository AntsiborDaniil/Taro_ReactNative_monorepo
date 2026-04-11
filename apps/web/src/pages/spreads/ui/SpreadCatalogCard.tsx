import { memo, useCallback, useMemo, useState } from 'react';
import {
  Image,
  type ImageSourcePropType,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type DimensionValue,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { LockIcon } from 'shared/icons';
import { COLORS, getColorOpacity } from 'shared/themes';
import { OverlayIcon } from 'shared/ui/OverlayIcon';
import { Text, TEXT_TAGS } from 'shared/ui/Text';

import type { SpreadsLayout } from './useSpreadsLayout';

type SpreadCatalogCardProps = {
  title: string;
  imageSource: ImageSourcePropType;
  width: DimensionValue;
  imageAreaHeight?: number;
  isLocked?: boolean;
  onPress: () => void;
  layout: SpreadsLayout;
};

function SpreadCatalogCard({
  title,
  imageSource,
  width,
  imageAreaHeight,
  isLocked = false,
  onPress,
  layout,
}: SpreadCatalogCardProps) {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const interactive = hovered || pressed;

  const previewH = imageAreaHeight ?? layout.previewHeight;

  const textBlockStyle = useMemo(
    () => ({
      paddingHorizontal: layout.textPadH,
      paddingTop: layout.textPadTop,
      paddingBottom: layout.textPadBottom,
      gap: layout.textBlockGap,
    }),
    [layout]
  );

  const titleStyle = useMemo(
    () => ({
      fontSize: layout.titleFontSize,
    }),
    [layout.titleFontSize]
  );

  const hintStyle = useMemo(
    () => ({
      fontSize: layout.hintFontSize,
    }),
    [layout.hintFontSize]
  );

  const onHoverIn = useCallback(() => setHovered(true), []);
  const onHoverOut = useCallback(() => setHovered(false), []);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${isLocked ? t('core:spreads.catalog.hintLocked') : t('core:spreads.catalog.hint')}`}
      onPress={onPress}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[
        styles.card,
        { width, borderRadius: layout.cardBorderRadius },
        interactive && styles.cardActive,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={[styles.imageShell, { height: previewH }]}>
        <View style={styles.imageBounds}>
          <Image
            accessibilityIgnoresInvertColors
            source={imageSource}
            resizeMode="cover"
            style={styles.spreadImage}
          />
          <LinearGradient
            colors={[
              getColorOpacity(COLORS.Background2, 0),
              COLORS.Background2,
            ]}
            style={[styles.imageFade, { height: layout.imageFadeHeight }]}
          />
        </View>
        {isLocked && (
          <OverlayIcon>
            <LockIcon
              width={layout.lockIconSize}
              height={layout.lockIconSize}
              fill={COLORS.Content}
              style={[
                styles.lockIcon,
                {
                  width: layout.lockIconSize + 8,
                  height: layout.lockIconSize + 8,
                },
              ]}
            />
          </OverlayIcon>
        )}
      </View>

      <View style={[styles.textBlock, textBlockStyle]}>
        <Text
          category={TEXT_TAGS.label}
          style={[styles.title, titleStyle]}
          numberOfLines={2}
        >
          {title}
        </Text>
        <Text
          category={TEXT_TAGS.label}
          style={[
            styles.hint,
            hintStyle,
            interactive && !isLocked && styles.hintActive,
            isLocked && styles.hintLocked,
          ]}
        >
          {isLocked
            ? t('core:spreads.catalog.hintLocked')
            : t('core:spreads.catalog.hint')}
        </Text>
      </View>
    </Pressable>
  );
}

export default memo(SpreadCatalogCard);

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.Background2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: getColorOpacity(COLORS.SpbSky1, 35),
    ...Platform.select({
      web: {
        boxShadow: '0 10px 28px rgba(0, 0, 0, 0.22)',
        cursor: 'pointer',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 14,
        elevation: 8,
      },
    }),
  },
  cardActive: Platform.select({
    web: {
      boxShadow: '0 16px 36px rgba(0, 0, 0, 0.28)',
    },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.22,
      shadowRadius: 16,
      elevation: 10,
    },
  }),
  cardPressed: {
    opacity: 0.94,
  },
  imageShell: {
    width: '100%',
    backgroundColor: getColorOpacity(COLORS.SpbSky4, 35),
    position: 'relative',
    overflow: 'hidden',
  },
  imageBounds: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  spreadImage: {
    width: '100%',
    height: '100%',
    minWidth: '100%',
    alignSelf: 'stretch',
    ...Platform.select({
      web: {
        objectFit: 'cover',
        objectPosition: 'center center',
      },
    }),
  },
  imageFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  lockIcon: {},
  textBlock: {
    flexDirection: 'column',
  },
  title: {
    letterSpacing: 0.12,
  },
  hint: {
    marginBottom: 8,
    color: getColorOpacity(COLORS.Content, 68),
    letterSpacing: 0.15,
  },
  hintActive: {
    color: COLORS.Primary,
  },
  hintLocked: {
    color: getColorOpacity(COLORS.Content, 52),
  },
});
