import type { TFunction } from 'i18next';
import type { TSpread } from '@entities/spread';
import type { PairCardDto } from '../model/types';

/** Вытянутые карты расклада → тело API: имя карты и подпись позиции на языке интерфейса. */
export function toPairCards(spread: TSpread, t: TFunction): PairCardDto[] {
  return spread.selectedCards.map((item, index) => ({
    card_id: item.id,
    card: t(item.name),
    direction: item.direction,
    label: spread.cardsOrder?.[index]?.meaning ? t(`spread:${spread.cardsOrder[index].meaning}`) : '',
  }));
}
