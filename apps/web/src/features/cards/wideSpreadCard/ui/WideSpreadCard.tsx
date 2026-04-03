import React from 'react';
import { DimensionValue, StyleSheet } from 'react-native';
import { DeckStyle, TSpread } from 'shared/api';
import { getImage } from 'shared/lib';
import { ImagePosition } from 'shared/types';
import { TileCard } from 'shared/ui';

type WideSpreadCardProps = {
  spread?: TSpread;
  height?: DimensionValue;
  width?: DimensionValue;
};

function WideSpreadCard({ spread, width, height }: WideSpreadCardProps) {
  const { id, name } = spread ?? {};

  return (
    <TileCard
      id={id}
      width={width ?? 213}
      height={height ?? 163}
      imageSource={getImage(['spreads', DeckStyle.FlatIllustration, `{id}`])}
      imagePosition={ImagePosition.Background}
      textStyles={styles.text}
    >
      {name ?? ''}
    </TileCard>
  );
}

export default WideSpreadCard;

const styles = StyleSheet.create({
  text: {
    maxWidth: 152,
    paddingLeft: 12,
    height: 42,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
});
