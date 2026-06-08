import {
  Platform,
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
import { COLORS, getColorOpacity } from 'shared/themes';
import { NavigationRoute } from 'shared/types';
import { Text, TEXT_TAGS } from 'shared/ui';
import { spreadInnerStyles } from 'shared/lib/spreadInnerUi';

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

  const selectedCount = spread.selectedCards?.length ?? 0;

  return (
    <View style={[styles.wrapper, style]}>
      <Text category={TEXT_TAGS.label} style={styles.sectionTitle}>
        {t('spread:flow.positionsTitle')}
      </Text>
      {spread.cardsOrder.map((item, index) => {
        const isDone = index < selectedCount;
        const isActive = !isSpreadCompleted && index === selectedCount;
        const isLast = index === spread.cardsOrder.length - 1;

        return (
          <View key={`descriptionRow-${index}`} style={spreadInnerStyles.timelineRow}>
            <View style={spreadInnerStyles.timelineRail}>
              {!isLast && <View style={spreadInnerStyles.timelineLine} />}
              <View
                style={[
                  spreadInnerStyles.timelineDot,
                  {
                    borderColor: isDone
                      ? getColorOpacity(COLORS.Success500, 70)
                      : isActive
                        ? COLORS.Primary
                        : getColorOpacity(COLORS.SpbSky1, 40),
                    backgroundColor: isDone
                      ? getColorOpacity(COLORS.Success500, 35)
                      : isActive
                        ? getColorOpacity(COLORS.Primary, 35)
                        : COLORS.Background2,
                  },
                ]}
              />
            </View>

            <TouchableOpacity
              activeOpacity={isSpreadCompleted ? 0.75 : 1}
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
              style={[
                spreadInnerStyles.positionCard,
                isActive && spreadInnerStyles.positionCardActive,
                isDone && spreadInnerStyles.positionCardDone,
                isSpreadCompleted && spreadInnerStyles.positionCardPressable,
              ]}
            >
              <TarotSchemeCard
                forceHasImage={isDone}
                hasRotation={false}
                content={index + 1}
                style={styles.card}
              />
              <View style={styles.description}>
                <Text style={spreadInnerStyles.positionIndex}>
                  {`${t('core:card')} ${index + 1}`}
                </Text>
                <Text category={TEXT_TAGS.p2} style={spreadInnerStyles.positionMeaning}>
                  {t(`spread:${item.meaning}`)}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 4,
    marginTop: 4,
  },
  sectionTitle: {
    color: getColorOpacity(COLORS.Content, 55),
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
    ...Platform.select({
      web: { fontSize: 11 },
      default: {},
    }),
  },
  description: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  card: {
    ...SCHEME_CARD_SIZE,
  },
});

export default CardDescription;
