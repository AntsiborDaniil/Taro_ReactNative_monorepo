import { TSpreadCardCoords, TSpreadCardsOrder } from 'shared/api';

type TSpreadCardsArrayWithCoordsParams = {
  initialCardsOrder: TSpreadCardsOrder[];
  cardIndex: number;
  coords: TSpreadCardCoords;
};

export function modifyCardsArrayWithCoords({
  initialCardsOrder,
  coords,
  cardIndex,
}: TSpreadCardsArrayWithCoordsParams): TSpreadCardsOrder[] {
  return initialCardsOrder.map((card, index) => {
    if (index !== cardIndex) {
      return card;
    }

    return {
      ...card,
      coords,
    };
  });
}
