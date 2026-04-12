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
import { TEXT_WEIGHT, TileCard } from 'shared/ui';

type CategoryCardProps = {
  card?: TRedirectPlate;
  tileWidth: number;
  tileHeight: number;
  cornerImageWidth: number;
  cornerImageHeight: number;
  /** Кегль заголовка на плитке (библиотека). */
  titleFontSize?: number;
};

function CategoryCard({
  card,
  tileWidth,
  tileHeight,
  cornerImageWidth,
  cornerImageHeight,
  titleFontSize,
}: CategoryCardProps) {
  const { img, id, name, navigationRoute, gradient, tabRoute } = card ?? {};

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
        fontWeight={TEXT_WEIGHT.regular}
        textStyles={[
          styles.text,
          titleFontSize != null ? { fontSize: titleFontSize } : null,
        ]}
        onPress={handlePress}
        gradient={gradient}
      >
        {name ?? ''}
      </TileCard>
    </View>
  );
}

export default CategoryCard;

const styles = StyleSheet.create({
  text: {
    padding: 12,
  },
});
