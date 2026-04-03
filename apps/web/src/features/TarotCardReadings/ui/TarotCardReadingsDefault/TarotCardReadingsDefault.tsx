import { useState } from 'react';
import { Dimensions, SafeAreaView, StyleSheet, View } from 'react-native';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { LikeCard } from 'entities/favorites';
import { useTranslation } from 'react-i18next';
import { TSelectedTarotCard } from 'shared/api';
import { useData } from 'shared/DataProvider';
import { LeafIcon } from 'shared/icons';
import { COLORS } from 'shared/themes';
import { TarotCard, Text, TEXT_TAGS } from 'shared/ui';
import { TarotCharacteristics } from '../TarotCharacteristics';
import TarotMeanings from '../TarotMeanings/TarotMeanings';

type TarotCardReadingsDefaultProps = {
  card: TSelectedTarotCard;
};

function TarotCardReadingsDefault({ card }: TarotCardReadingsDefaultProps) {
  const { t } = useTranslation();
  const { width } = Dimensions.get('window');

  const { handleVibrationClick } = useData({
    Context: ApplicationConfigContext,
  });

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const handleLayout = (event: any) => {
    const { width, height } = event.nativeEvent.layout;

    if (dimensions.width !== 0) {
      return;
    }

    setDimensions({ width, height });
  };

  const splittedTitle = t(card.name).split(' ');

  const middleIndex = Math.floor(splittedTitle.length / 2);

  const resultedTitle =
    width - dimensions.width < 32
      ? `${splittedTitle.slice(0, middleIndex).join(' ')}\n${splittedTitle.slice(middleIndex).join(' ')}`
      : t(card.name);

  return (
    <SafeAreaView style={styles.content}>
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
        </View>
        <TarotCharacteristics card={card} />
        <View style={styles.paddingWrapper}>
          <TarotMeanings card={card} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { gap: 20 },
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
});

export default TarotCardReadingsDefault;
