import React, { ReactElement } from 'react';
import { Platform, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { TarotCardArcana, TarotCardSuit } from 'shared/api';
import { useData } from 'shared/DataProvider';
import { isTablet } from 'shared/lib';
import { DS_COLORS, dsWebTransition } from 'shared/themes/ds';
import { TSuitItem } from '../lib/constants';

export type SuitItemProps = {
  setSelectedSuitOrArcana: (value: TarotCardSuit | TarotCardArcana) => void;
  selectedSuitOrArcana: TarotCardArcana | TarotCardSuit;
  suitItem: TSuitItem;
};

/** Чип-фильтр раздела словаря: капсула DS, выбранный — заливка calm600 + кант accent400. */
function SuitItem({
  suitItem,
  selectedSuitOrArcana,
  setSelectedSuitOrArcana,
}: SuitItemProps): ReactElement {
  const { width } = useWindowDimensions();
  const { Icon, id, suitOrArcana } = suitItem;
  const isCompact = width < 430;
  const size = isTablet ? 68 : isCompact ? 50 : 58;

  const checked = selectedSuitOrArcana === suitOrArcana;

  const { handleVibrationClick } = useData({
    Context: ApplicationConfigContext,
  });

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={async () => {
        await handleVibrationClick?.();

        setSelectedSuitOrArcana(suitOrArcana);
      }}
      key={id}
      style={[
        styles.item,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        checked ? styles.itemSelected : null,
      ]}
    >
      <Icon
        width={isTablet ? 30 : isCompact ? 24 : 26}
        height={isTablet ? 30 : isCompact ? 24 : 26}
        fill={checked ? DS_COLORS.ink50 : DS_COLORS.ink100}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  item: {
    backgroundColor: DS_COLORS.ground700,
    borderWidth: 1,
    borderColor: DS_COLORS.ground600,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...dsWebTransition,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : {}),
  },
  itemSelected: {
    backgroundColor: DS_COLORS.calm600,
    borderColor: DS_COLORS.accent400,
  },
});

export default SuitItem;
