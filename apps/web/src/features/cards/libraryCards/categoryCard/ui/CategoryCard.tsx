import { StyleSheet, View } from 'react-native';
import AppMetrica from '@appmetrica/react-native-analytics';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { useData } from 'shared/DataProvider';
import { useNativeNavigation } from 'shared/hooks';
import { horizontalScale, isTablet, verticalScale, width } from 'shared/lib';
import {
  AnalyticAction,
  ImagePosition,
  NavigationRoute,
  TRedirectPlate,
} from 'shared/types';
import { TEXT_WEIGHT, TileCard } from 'shared/ui';

type CategoryCardProps = {
  card?: TRedirectPlate;
};

const cardWidth = isTablet ? (width - 16 - 16) / 2 - 16 : (width - 32 - 16) / 2;

function CategoryCard({ card }: CategoryCardProps) {
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
    <View style={styles.container}>
      <TileCard
        id={id}
        imageSource={img}
        width={cardWidth}
        height={verticalScale(150)}
        imageWidth={horizontalScale(100)}
        imageHeight={verticalScale(100)}
        imagePosition={ImagePosition.Corner}
        fontWeight={TEXT_WEIGHT.regular}
        textStyles={styles.text}
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
  container: {
    flex: 1,
  },
  text: {
    padding: 12,
  },
});
