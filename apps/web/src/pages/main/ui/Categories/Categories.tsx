import {
  Image,
  ImageSourcePropType,
  TouchableOpacity,
  View,
} from 'react-native';
import AppMetrica from '@appmetrica/react-native-analytics';
import { StyleService } from '@ui-kitten/components';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { useTranslation } from 'react-i18next';
import { useData } from 'shared/DataProvider';
import { useNativeNavigation } from 'shared/hooks';
import { horizontalScale } from 'shared/lib';
import { COLORS } from 'shared/themes';
import { AnalyticAction } from 'shared/types';
import { Text, TEXT_TAGS, TEXT_WEIGHT } from 'shared/ui';
import { CATEGORIES } from '../../lib';

function Categories() {
  const { t } = useTranslation();

  const navigation = useNativeNavigation();

  const { handleVibrationClick } = useData({
    Context: ApplicationConfigContext,
  });

  return (
    <View style={styles.container}>
      {CATEGORIES.map((category) => (
        <TouchableOpacity
          key={category.id}
          style={styles.wrapper}
          activeOpacity={0.7}
          onPress={async () => {
            AppMetrica.reportEvent(AnalyticAction.ClickCategoryMainPage, {
              category: category.name,
            });

            await handleVibrationClick?.();

            navigation.navigate(category.tabRoute, {
              screen: category.navigationRoute,
            });
          }}
        >
          <Image
            style={styles.image}
            source={(category.img ?? '') as ImageSourcePropType}
          />
          <Text
            style={styles.text}
            category={TEXT_TAGS.h5}
            weight={TEXT_WEIGHT.regular}
          >
            {t(category.name)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleService.create({
  image: {
    width: horizontalScale(65),
    height: horizontalScale(65),
    borderRadius: 100,
    borderWidth: 1,
    borderColor: COLORS.Content,
  },
  container: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  wrapper: {
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column',
    gap: 6,
  },
  text: {
    textAlign: 'center',
  },
});

export default Categories;
