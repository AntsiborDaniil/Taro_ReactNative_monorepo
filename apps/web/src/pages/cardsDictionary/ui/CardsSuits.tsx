import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { TarotCardArcana, TarotCardSuit } from 'shared/api';
import { isTablet, moderateScale } from 'shared/lib';
import { SUITS_DATA } from '../lib';
import SuitItem from './SuitItem';

type CardsSuitsProps = {
  selectedSuitOrArcana: TarotCardArcana | TarotCardSuit;
  setSelectedSuitOrArcana: (value: TarotCardSuit | TarotCardArcana) => void;
};

function CardsSuits({
  selectedSuitOrArcana,
  setSelectedSuitOrArcana,
}: CardsSuitsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      style={styles.scroll}
    >
      <View style={styles.container}>
        {SUITS_DATA.map((item) => (
          <SuitItem
            suitItem={item}
            key={item.id}
            selectedSuitOrArcana={selectedSuitOrArcana}
            setSelectedSuitOrArcana={setSelectedSuitOrArcana}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    marginTop: 8,
  },
  scrollContent: {
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  container: {
    flexDirection: 'row',
    gap: isTablet ? moderateScale(24) : 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CardsSuits;
