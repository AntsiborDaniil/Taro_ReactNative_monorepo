import {
  SafeAreaView,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { SpreadContext } from 'entities/Spread';
import { useTranslation } from 'react-i18next';
import { TarotSchemeCard } from 'features/scheme';
import { SCHEME_CARD_SIZE } from 'shared/constants';
import { useData } from 'shared/DataProvider';
import { useNativeNavigation } from 'shared/hooks';
import { moderateScale } from 'shared/lib';
import { COLORS } from 'shared/themes';
import { NavigationRoute } from 'shared/types';
import { Text } from 'shared/ui';

type CardDescriptionProps = {
  style?: StyleProp<ViewStyle>;
};

function CardDescription({ style }: CardDescriptionProps) {
  const { t } = useTranslation();

  const { spread, isSpreadCompleted, handleGetAIInterpretation } = useData({
    Context: SpreadContext,
  });

  const { handleVibrationClick } = useData({
    Context: ApplicationConfigContext,
  });

  const navigation = useNativeNavigation();

  if (!spread || spread?.cardsCount === 1 || !spread.cardsOrder?.length) {
    return null;
  }

  return (
    <SafeAreaView style={[styles.wrapper, style]}>
      {spread.cardsOrder.map((item, index) => (
        <TouchableOpacity
          activeOpacity={isSpreadCompleted ? 0.7 : 1}
          onPress={
            isSpreadCompleted
              ? async () => {
                  await handleVibrationClick?.();

                  await handleGetAIInterpretation?.();

                  // @ts-expect-error wrong route
                  navigation.navigate(NavigationRoute.SpreadReadings, {
                    cardIndex: index + 1,
                  });
                }
              : undefined
          }
          key={`descriptionRow-${index}`}
          style={styles.row}
        >
          <TarotSchemeCard
            forceHasImage
            hasRotation={false}
            content={index + 1}
            style={styles.card}
          />
          <View style={styles.description}>
            <Text style={styles.title}>{`${t('core:card')} ${index + 1}`}</Text>
            <Text>{t(`spread:${item.meaning}`)}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: moderateScale(16),
  },
  description: {
    paddingLeft: 16,
    flex: 1,
    justifyContent: 'center',
    gap: 6,
  },
  row: {
    flexDirection: 'row',
  },
  card: {
    ...SCHEME_CARD_SIZE,
  },
  title: {
    color: COLORS.SpbSky2,
  },
});

export default CardDescription;
