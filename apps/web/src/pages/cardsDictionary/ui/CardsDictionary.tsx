import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Header } from 'features/header';
import {
  ARCANAS_AND_SUITS_NAMES,
  TarotCardArcana,
  TarotCardSuit,
} from 'shared/api';
import { webVerticalScrollProps } from 'shared/lib/web/webScrollClasses';
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
    <ScreenLayout style={styles.screen}>
      <Header showBackButton title={t('core:page.dictionary')} />
      <View style={styles.scrollHost}>
        <ScrollView
          style={styles.wrapper}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          nestedScrollEnabled
          {...webVerticalScrollProps()}
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
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    minHeight: 0,
  },
  scrollHost: {
    flex: 1,
    minHeight: 0,
  },
  wrapper: {
    flex: 1,
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
