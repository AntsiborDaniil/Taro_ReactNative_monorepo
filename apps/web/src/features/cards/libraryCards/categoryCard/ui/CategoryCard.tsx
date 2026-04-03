import { StyleSheet, View } from 'react-native';
import AppMetrica from '@appmetrica/react-native-analytics';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { useData } from 'shared/DataProvider';
import { useNativeNavigation } from 'shared/hooks';
import { horizontalScale, verticalScale } from 'shared/lib';
import {
  AnalyticAction,
  ImagePosition,
  NavigationRoute,
  TRedirectPlate,
} from 'shared/types';
import { TEXT_WEIGHT, TileCard } from 'shared/ui';

type CategoryCardProps = {
  card?: TRedirectPlate;
  /** Explicit pixel width; if omitted the card fills the flex parent */
  cardWidth?: number;
};

function CategoryCard({ card, cardWidth }: CategoryCardProps) {
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
        width={cardWidth ?? '100%'}
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
