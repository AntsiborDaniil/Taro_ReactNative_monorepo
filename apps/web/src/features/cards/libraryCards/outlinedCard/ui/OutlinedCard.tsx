import React from 'react';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { DeckStyle, TDeckStyle, TSpread } from 'shared/api';
import { useData } from 'shared/DataProvider';
import { getImage } from 'shared/lib';
import { ImagePosition, TextPosition } from 'shared/types';
import { TEXT_WEIGHT, TileCard } from 'shared/ui';

type OutlinedCardProps = {
  card?: TSpread | TDeckStyle;
  isSelected?: boolean;
  deckStyle?: DeckStyle;
  onPress?: () => void;
};

function OutlinedCard({
  card,
  deckStyle,
  isSelected,
  onPress,
}: OutlinedCardProps) {
  const { appearance } = useData({ Context: ApplicationConfigContext });

  const { id } = card ?? {};

  return (
    <TileCard
      id={id}
      imageSource={getImage([
        'tarotCards',
        deckStyle ?? appearance?.deckStyle ?? DeckStyle.FlatIllustration,
        `card${id}`,
      ])}
      width={101}
      height={150}
      imagePosition={ImagePosition.Background}
      textPosition={TextPosition.Outer}
      fontWeight={TEXT_WEIGHT.regular}
      hasOutline
      isSelected={isSelected}
      onPress={onPress}
    />
  );
}

export default OutlinedCard;
