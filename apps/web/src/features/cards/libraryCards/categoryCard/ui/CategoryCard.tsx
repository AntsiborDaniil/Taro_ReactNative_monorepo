import { Platform, StyleSheet, View } from 'react-native';
import AppMetrica from '@appmetrica/react-native-analytics';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { useData } from 'shared/DataProvider';
import { useNativeNavigation } from 'shared/hooks';
import {
  AnalyticAction,
  ImagePosition,
  NavigationRoute,
  TRedirectPlate,
} from 'shared/types';
import { COLORS } from 'shared/themes';
import { TEXT_WEIGHT, TileCard } from 'shared/ui';

type CategoryCardProps = {
  card?: TRedirectPlate;
  tileWidth: number;
  tileHeight: number;
  cornerImageWidth: number;
  cornerImageHeight: number;
  /** Кегль заголовка на плитке (библиотека). */
  titleFontSize?: number;
  tileSubtitleFontSize?: number;
  tileSubtitleLineHeight?: number;
  isTileTitleMidViewport?: boolean;
  /** Плитка на всю ширину колонки (мобильный столбик). */
  fullWidth?: boolean;
  /** Нижний tab bar — без подписей на плитке, только арт. */
  imageOnly?: boolean;
};

function CategoryCard({
  card,
  tileWidth,
  tileHeight,
  cornerImageWidth,
  cornerImageHeight,
  titleFontSize,
  tileSubtitleFontSize,
  tileSubtitleLineHeight,
  isTileTitleMidViewport = false,
  fullWidth = false,
  imageOnly = false,
}: CategoryCardProps) {
  const {
    img,
    id,
    name,
    navigationRoute,
    gradient,
    tabRoute,
    subtitle,
  } = card ?? {};

  const navigation = useNativeNavigation();

  const { handleVibrationClick } = useData({
    Context: ApplicationConfigContext,
  });

  const isFavorite = navigationRoute === NavigationRoute.FavoriteCards;
  const isHistory = navigationRoute === NavigationRoute.SpreadsHistory;
  const useMidTitleLayout =
    !imageOnly && isTileTitleMidViewport && (isFavorite || isHistory);

  const artWidth = imageOnly
    ? Math.round(tileWidth * 0.76)
    : cornerImageWidth;
  const artHeight = imageOnly
    ? Math.round(tileHeight * 0.76)
    : cornerImageHeight;

  const handlePress = async () => {
    await handleVibrationClick?.();

    if (!tabRoute || !navigationRoute) {
      return;
    }

    AppMetrica.reportEvent(AnalyticAction.ClickCategoriesLibrary, {
      category: name,
    });

    navigation.navigate(tabRoute, {
      screen: navigationRoute as NavigationRoute,
    });
  };

  return (
    <View
      style={[
        styles.tileWrap,
        fullWidth ? styles.tileWrapFull : { width: tileWidth },
      ]}
    >
      <TileCard
        id={id}
        imageSource={img}
        width={fullWidth ? '100%' : tileWidth}
        height={tileHeight}
        imageWidth={artWidth}
        imageHeight={artHeight}
        imageOnly={imageOnly}
        imagePosition={ImagePosition.Corner}
        imageOffsetX={6}
        imageOffsetY={8}
        fontWeight={TEXT_WEIGHT.medium}
        textStyles={[
          styles.tileTitle,
          titleFontSize != null
            ? {
                fontSize: titleFontSize,
                lineHeight: Math.round(titleFontSize * 1.28),
              }
            : null,
          useMidTitleLayout && isFavorite && styles.titleNowrap,
          useMidTitleLayout && isHistory && styles.titlePreLine,
        ]}
        textViewStyles={
          fullWidth
            ? styles.cornerTextBlockMobile
            : useMidTitleLayout
              ? styles.cornerTextBlockMid
              : undefined
        }
        titleNumberOfLines={
          useMidTitleLayout && isFavorite
            ? 1
            : useMidTitleLayout && isHistory
              ? 2
              : undefined
        }
        titleEllipsizeMode={
          useMidTitleLayout && isHistory ? undefined : 'tail'
        }
        onPress={handlePress}
        gradient={gradient}
        subtitle={imageOnly ? undefined : subtitle}
        subtitleStyle={
          tileSubtitleFontSize != null && tileSubtitleLineHeight != null
            ? {
                fontSize: tileSubtitleFontSize,
                lineHeight: tileSubtitleLineHeight,
              }
            : undefined
        }
      >
        {name ?? ''}
      </TileCard>
    </View>
  );
}

export default CategoryCard;

const styles = StyleSheet.create({
  tileWrap: {
    maxWidth: '100%',
  },
  tileWrapFull: Platform.select({
    web: {
      width: '100%',
      alignSelf: 'stretch',
      flexShrink: 0,
      flexGrow: 0,
    } as object,
    default: {
      width: '100%',
      alignSelf: 'stretch',
    },
  }),
  cornerTextBlockMobile: {
    maxWidth: '58%',
  },
  tileTitle: {
    paddingBottom: 1,
    color: COLORS.Content,
  },
  titleNowrap: Platform.select({
    web: {
      whiteSpace: 'nowrap',
      textWrap: 'nowrap',
    } as object,
    default: {},
  }),
  titlePreLine: Platform.select({
    web: {
      whiteSpace: 'pre-line',
      overflowWrap: 'normal',
      wordBreak: 'normal',
    } as object,
    default: {},
  }),
  cornerTextBlockMid: {
    maxWidth: '52%',
  },
});
