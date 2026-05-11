import { StyleSheet, View } from 'react-native';
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
    <View style={{ width: tileWidth }}>
      <TileCard
        id={id}
        imageSource={img}
        width={tileWidth}
        height={tileHeight}
        imageWidth={cornerImageWidth}
        imageHeight={cornerImageHeight}
        imagePosition={ImagePosition.Corner}
        imageOffsetX={6}
        imageOffsetY={8}
        fontWeight={TEXT_WEIGHT.semibold}
        textStyles={[
          styles.tileTitle,
          titleFontSize != null
            ? {
                fontSize: titleFontSize,
                lineHeight: Math.round(titleFontSize * 1.28),
              }
            : null,
        ]}
        onPress={handlePress}
        gradient={gradient}
        subtitle={subtitle}
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
  tileTitle: {
    paddingBottom: 1,
    color: COLORS.Content,
  },
});
