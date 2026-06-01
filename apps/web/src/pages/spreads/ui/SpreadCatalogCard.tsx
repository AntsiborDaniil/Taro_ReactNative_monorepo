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
import { WEB_HOVER_TRANSITION } from 'shared/lib';
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
  /** Чип на превью: простой расклад доступен гостю (веб). */
  guestNoAuthBadge?: boolean;
  onPress: () => void;
  layout: SpreadsLayout;
};

function SpreadCatalogCard({
  title,
  imageSource,
  width,
  imageAreaHeight,
  isLocked = false,
  guestNoAuthBadge = false,
  onPress,
  layout,
}: SpreadCatalogCardProps) {
  const { t } = useTranslation();
  const { t: tSpread } = useTranslation('spread');
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
      lineHeight: Math.round(layout.titleFontSize * 1.25),
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

  const a11yHint = isLocked
    ? t('core:spreads.catalog.hintLocked')
    : t('core:spreads.catalog.hint');
  const a11yBadge = guestNoAuthBadge ? ` ${tSpread('guestSpread.badge')}.` : '';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${a11yHint}${a11yBadge}`}
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
        {guestNoAuthBadge && (
          <LinearGradient
            colors={[
              getColorOpacity(COLORS.Primary, 22),
              getColorOpacity(COLORS.Secondary, 28),
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.guestBadge}
          >
            <Text category={TEXT_TAGS.label} style={styles.guestBadgeText}>
              {tSpread('guestSpread.badge')}
            </Text>
          </LinearGradient>
        )}
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
          category={TEXT_TAGS.h4}
          style={[styles.title, titleStyle]}
          numberOfLines={2}
        >
          {title}
        </Text>
        <Text
          category={TEXT_TAGS.p2}
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
        ...WEB_HOVER_TRANSITION,
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
    backgroundColor: COLORS.SpbSky4,
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
  guestBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 2,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: getColorOpacity(COLORS.Secondary, 0.35),
    maxWidth: '78%',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 4,
      },
    }),
  },
  guestBadgeText: {
    color: COLORS.Content,
    letterSpacing: 0.2,
    fontWeight: '600',
    fontSize: 11,
    lineHeight: 14,
  },
  lockIcon: {},
  textBlock: {
    flexDirection: 'column',
  },
  title: {
    letterSpacing: 0.12,
    color: COLORS.Content,
  },
  hint: {
    marginBottom: 8,
    color: getColorOpacity(COLORS.Content, 72),
    letterSpacing: 0.15,
    lineHeight: 22,
  },
  hintActive: {
    color: COLORS.Primary,
  },
  hintLocked: {
    color: getColorOpacity(COLORS.Content, 52),
  },
});
