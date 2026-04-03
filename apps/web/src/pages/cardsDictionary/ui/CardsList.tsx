import { memo, useMemo } from 'react';
import AppMetrica from '@appmetrica/react-native-analytics';
import {
  TarotCardArcana,
  tarotCards,
  TarotCardSuit,
  TTarotCard,
} from 'shared/api';
import { AnalyticAction } from 'shared/types';
import { CardsList as CardsListBase } from 'shared/ui';

type CardsListProps = {
  selectedSuitOrArcana: TarotCardArcana | TarotCardSuit;
};

function CardsList({ selectedSuitOrArcana }: CardsListProps) {
  const onPressCard = (card: TTarotCard): void => {
    AppMetrica.reportEvent(AnalyticAction.ClickTarotCard, {
      [selectedSuitOrArcana]: card.id,
    });
  };

  const cardsGroups = useMemo(() => {
    return Object.values(tarotCards).reduce(
      (
        acc: Partial<Record<TarotCardSuit | TarotCardArcana, TTarotCard[]>>,
        currentValue
      ) => {
        if (acc?.[currentValue.suit || currentValue.arcana]?.length) {
          acc?.[currentValue.suit || currentValue.arcana]?.push(currentValue);

          return acc;
        }

        return {
          ...acc,
          [currentValue.suit || currentValue.arcana]: [currentValue],
        };
      },
      {}
    );
  }, []);

  return (
    <CardsListBase
      onPressAnalytics={onPressCard}
      cards={cardsGroups[selectedSuitOrArcana] ?? []}
    />
  );
}

export default memo(CardsList);
