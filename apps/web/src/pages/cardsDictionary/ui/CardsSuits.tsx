import React from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
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
  const { t } = useTranslation();

  const items = SUITS_DATA.map((item) => (
    <SuitItem
      suitItem={item}
      key={item.id}
      selectedSuitOrArcana={selectedSuitOrArcana}
      setSelectedSuitOrArcana={setSelectedSuitOrArcana}
    />
  ));

  if (Platform.OS === 'web') {
    return (
      <View
        style={styles.webRow}
        // react-native-web: горизонтальная прокрутка тачпадом / drag
        {...({
          className: 'tarot-web-scroll-x',
        } as { className?: string })}
        accessibilityRole="toolbar"
        accessibilityLabel={t('core:a11y.suitsRow')}
        accessibilityHint={t('core:a11y.horizontalScrollHint')}
      >
        {items}
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      style={styles.scroll}
      accessibilityRole="toolbar"
      accessibilityLabel={t('core:a11y.suitsRow')}
      accessibilityHint={t('core:a11y.horizontalScrollHint')}
    >
      <View style={styles.container}>{items}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  webRow: {
    width: '100%',
    marginTop: 8,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scroll: {
    marginTop: 8,
  },
  scrollContent: {
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
