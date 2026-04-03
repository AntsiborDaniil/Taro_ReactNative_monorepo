import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
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
    <SafeAreaView style={styles.container}>
      {SUITS_DATA.map((item) => (
        <SuitItem
          suitItem={item}
          key={item.id}
          selectedSuitOrArcana={selectedSuitOrArcana}
          setSelectedSuitOrArcana={setSelectedSuitOrArcana}
        />
      ))}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    flexDirection: 'row',
    gap: isTablet ? moderateScale(32) : 0,
    justifyContent: isTablet ? 'center' : 'space-between',
  },
});

export default CardsSuits;
