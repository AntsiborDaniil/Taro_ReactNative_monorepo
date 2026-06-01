import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Header } from 'features/header';
import {
  ARCANAS_AND_SUITS_NAMES,
  TarotCardArcana,
  TarotCardSuit,
} from 'shared/api';
import { CARDS_GRID_SIDE_PADDING_COMPACT } from 'shared/ui/CardsList/gridPadding';
import { ScreenLayout, Text, TEXT_TAGS, TEXT_WEIGHT } from 'shared/ui';
import CardsList from './CardsList';
import CardsSuits from './CardsSuits';

function CardsDictionary() {
  const [selectedSuitOrArcana, setSelectedSuitOrArcana] = useState<
    TarotCardArcana | TarotCardSuit
  >(TarotCardArcana.Major);

  const { t } = useTranslation();

  return (
    <ScreenLayout>
      <Header showBackButton title={t('core:page.dictionary')} />
      <ScrollView
        style={styles.wrapper}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <CardsSuits
          selectedSuitOrArcana={selectedSuitOrArcana}
          setSelectedSuitOrArcana={setSelectedSuitOrArcana}
        />
        <Text
          style={styles.text}
          category={TEXT_TAGS.h4}
          weight={TEXT_WEIGHT.medium}
        >
          {t(ARCANAS_AND_SUITS_NAMES[selectedSuitOrArcana])}
        </Text>
        <CardsList selectedSuitOrArcana={selectedSuitOrArcana} />
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: CARDS_GRID_SIDE_PADDING_COMPACT,
  },
  content: {
    paddingBottom: 28,
  },
  text: {
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 10,
  },
});

export default CardsDictionary;
