import { ReactElement, useState } from 'react';
import {
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Header } from 'features/header';
import { useData } from 'shared/DataProvider';
import { Button, ScreenLayout, TarotCard, Text, TEXT_TAGS } from 'shared/ui';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { LikeCard } from 'entities/favorites';
import { MotivationContext } from 'entities/tarotMotivation';
import { TarotCharacteristics } from 'features/TarotCardReadings/ui/TarotCharacteristics';
import TarotMeanings from 'features/TarotCardReadings/ui/TarotMeanings/TarotMeanings';
import { useNativeNavigation } from 'shared/hooks';
import { LeafIcon, ReverseIcon } from 'shared/icons';
import { COLORS } from 'shared/themes';
import { NavigationRoute, TabRoute } from 'shared/types';
import { TarotCardDirection } from '../../../shared/api';

export type MoticationScreenScreenProps = {};

const { width } = Dimensions.get('window');

function MoticationScreen(
  props: MoticationScreenScreenProps
): ReactElement | null {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const { t } = useTranslation();

  const navigation = useNativeNavigation();

  const { selectedMotivation } = useData({ Context: MotivationContext });

  const { handleVibrationClick } = useData({
    Context: ApplicationConfigContext,
  });

  const card = selectedMotivation?.cards[0];

  if (!card) {
    return null;
  }

  const splittedTitle = t(card.name).split(' ');

  const middleIndex = Math.floor(splittedTitle.length / 2);

  const resultedTitle =
    width - dimensions.width < 32
      ? `${splittedTitle.slice(0, middleIndex).join(' ')}\n${splittedTitle.slice(middleIndex).join(' ')}`
      : t(card.name);

  const handleLayout = (event: any) => {
    const { width, height } = event.nativeEvent.layout;

    if (dimensions.width !== 0) {
      return;
    }

    setDimensions({ width, height });
  };

  return (
    <ScreenLayout>
      <Header title="" />
      <ScrollView>
        <View style={styles.contentInner}>
          <View style={styles.paddingWrapper}>
            <SafeAreaView style={styles.imageWrapper}>
              <TarotCard
                styleCard={{
                  width: '50%',
                  maxWidth: 300,
                }}
                cardId={card.id}
                direction={card.direction}
              />
            </SafeAreaView>

            <View>
              <View style={styles.titleContainer} onLayout={handleLayout}>
                <LeafIcon
                  fill={COLORS.Primary}
                  width={30}
                  height={30}
                  style={styles.leftLeaf}
                />
                <Text category={TEXT_TAGS.h2} style={styles.title}>
                  {resultedTitle}
                </Text>
                <LeafIcon fill={COLORS.Primary} width={30} height={30} />
                <LikeCard
                  card={card}
                  onAdditionalPress={async () => await handleVibrationClick?.()}
                />
              </View>
              {card.direction === TarotCardDirection.Reversed && (
                <View style={styles.reversedContainer}>
                  <Text category={TEXT_TAGS.h3} style={styles.title}>
                    {t('spread:reverseCard')}
                  </Text>
                  <ReverseIcon
                    width={24}
                    height={24}
                    style={{ marginBottom: 2 }}
                  />
                </View>
              )}
            </View>
          </View>

          <TarotCharacteristics card={card} />
          <View style={styles.paddingWrapper}>
            <TarotMeanings
              card={card}
              interpretation={selectedMotivation?.interpretation}
            />
            <View>
              <Button
                style={styles.doneButton}
                onPress={() => {
                  navigation.navigate(TabRoute.MainTab, {
                    screen: NavigationRoute.Main,
                  });
                }}
              >
                {t('core:finish')}
              </Button>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  contentInner: {
    gap: 20,
    alignItems: 'center',
    paddingVertical: 16,
  },
  paddingWrapper: {
    gap: 20,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  imageWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '50%',
  },
  leftLeaf: {
    transform: [{ scaleX: -1 }],
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    marginTop: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  doneButton: {
    width: width - 36,
  },
  reversedContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MoticationScreen;
