import { FC } from 'react';
import { SvgProps } from 'react-native-svg';
import { TarotCardArcana, TarotCardSuit } from 'shared/api';
import {
  ArcanaMajorIcon,
  CupsIcon,
  PentaclesIcon,
  SwordsIcon,
  WandsIcon,
} from 'shared/icons';

export type TSuitItem = {
  Icon: FC<SvgProps>;
  id: string;
  suitOrArcana: TarotCardArcana | TarotCardSuit;
};

export const SUITS_DATA: TSuitItem[] = [
  { Icon: ArcanaMajorIcon, id: 'major', suitOrArcana: TarotCardArcana.Major },
  { Icon: CupsIcon, id: 'cups', suitOrArcana: TarotCardSuit.Cups },
  { Icon: WandsIcon, id: 'wands', suitOrArcana: TarotCardSuit.Wands },
  { Icon: SwordsIcon, id: 'swords', suitOrArcana: TarotCardSuit.Swords },
  {
    Icon: PentaclesIcon,
    id: 'pentacles',
    suitOrArcana: TarotCardSuit.Pentacles,
  },
];
