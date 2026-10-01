import { DeckStyle } from '../application';
import { SubscriptionType } from '../user';

export enum SpreadsCategory {
  Simple = 'simple',
  Thematic = 'thematic',
  Universal = 'universal',
  SelfDevelopment = 'selfDevelopment',
  Choice = 'choice',
}

export enum SpreadName {
  Default = 'default',
  Simple_YesNo = 'simple_YesNo',
  Simple_DaySuggest = 'simple_daySuggest',
  Thematic_Relationship = 'thematic_relationship',
  Thematic_CareerFinance = 'thematic_careerFinance',
  Thematic_Love = 'thematic_love',
  Universal_CelticCross = 'universal_celticCross',
  Universal_Pyramid = 'universal_pyramid',
  Universal_Flame = 'universal_flame',
  Universal_Horseshoe = 'universal_horseshoe',
  SelfDevelopment_Mirror = 'selfDevelopment_mirror',
  SelfDevelopment_ShadowSide = 'selfDevelopment_shadowSide',
  Choice_TwoPaths = 'choice_twoPaths',
  Choice_Crossroad = 'choice_crossroad',
}

export enum TarotCardDirection {
  Upright = 'upright',
  Reversed = 'reversed',
}

export enum TarotCardSuit {
  Cups = 'cups',
  Wands = 'wands',
  Swords = 'swords',
  Pentacles = 'pentacles',
}

export enum TarotCardArcana {
  Major = 'major',
  Minor = 'minor',
}

export enum TarotCardElement {
  Fire = 'fire',
  Water = 'water',
  Air = 'air',
  Earth = 'earth',
}

export enum TarotCardPlanet {
  Mercury = 'mercury',
  Venus = 'venus',
  Mars = 'mars',
  Uranus = 'uranus',
  Jupiter = 'jupiter',
  Saturn = 'saturn',
  Neptune = 'neptune',
  Pluto = 'pluto',
  EarthPlanet = 'earth',

  Moon = 'moon',
  Sun = 'sun',
}

export enum TarotCardZodiac {
  Aries = 'aries',
  Taurus = 'taurus',
  Gemini = 'gemini',
  Cancer = 'cancer',
  Leo = 'leo',
  Virgo = 'virgo',
  Libra = 'libra',
  Scorpio = 'scorpio',
  Sagittarius = 'sagittarius',
  Capricorn = 'capricorn',
  Aquarius = 'aquarius',
  Pisces = 'pisces',
}
export type TSpreadCardCoords = {
  x: number;
  y: number;
};

export type TSpreadCardsOrder = {
  meaning: string;
};

export type TSpread = {
  name: string;
  id: SpreadName;
  description: string;
  category: SpreadsCategory;
  img: string;
  cardsCount: number;
  cardsPosition: TSpreadCardCoords[];
  selectedCards: TSelectedTarotCard[];
  cardsOrder: TSpreadCardsOrder[];
  availableSubscriptions: SubscriptionType[];
  horizontalPosition?: number[];
  // добавляются при сохранении расклада в памяти
  date?: string;
  uid?: string;
  packKey?: string;
  question?: string;
  interpretation?: string;
};

export type TSpreadCategory = {
  name: string;
  id: SpreadsCategory;
  spreads: TSpread[];
};

export type TDeckStyle = {
  name: string;
  id: number;
  value: DeckStyle;
};

export type TTarotCardTexts = {
  /*
  Текст у каждой карты будет означать ее значение исходя
  из ее положения в раскладе по индексу. очередность карт
  задается в массиве TSpreadCardsOrder.

  То есть в раскладе SpreadName.Thematic_Relationship
  в поле cardsOrder (TSpreadCardsOrder) элемент под индексом
  3: 'Помехи, препятствия, трудости, мешающие вам сблизиться с человеком'
  должен соответствовать
  meaning.[перевернутая/неперевернутая карта][SpreadName.Thematic_Relationship][3]
  и будет именно описание для этого значения

  то есть мы хотим, например, понять значение карты Маг в раскладе SpreadName.Thematic_Relationship,
  которая дает ответ на: 'Помехи, препятствия, трудости, мешающие вам сблизиться с человеком' и это
  объясненение будет в meaning.[перевернутая/неперевернутая карта][SpreadName.Thematic_Relationship][3]

  SpreadName.Default - это дефолтное значение карты, которое не привязано ни к каком раскладу,
  то есть значение карты само по себе
  */
  meaning: Record<TarotCardDirection, Record<SpreadName, string[]>>;
  /*
  Идентично meaning по подходу, это совет или предостержение, что дает карта в определенном раскладе.
  Размер меньше чем у meaning и description. Одно или 2 предложения. advice - одна строка в массиве
  */
  advice: Record<TarotCardDirection, Record<SpreadName, string[]>>;
  /*
  Ключевые слова, это что-то вроде чипсов\тегов, что должны быть массивом слов,
  где например в раскладе по любви это может быть ['страсть', 'открытость'], а в карьере
  ['риск', 'творчество']. Ключевых слов необходимо минимум 4 у каждого расклада.

  */
  keywords: Record<TarotCardDirection, Record<SpreadName, string[]>>;
  /*
  Описание Карты в завысимости от положения будет иметь одно значение.
  То есть у нас будет одно описание в зависимости от ориентации карты.
  Например как у Шута
      description: {
      [TarotCardDirection.Upright]: ['card:0.description.upright.0'],
      [TarotCardDirection.Reversed]: ['card:0.description.reversed.0'],
    },
  */
  description: Record<TarotCardDirection, string[]>;
  yesNo: Record<TarotCardDirection, string>;
};

export type TTarotCardBase = {
  id: string;
  code: string;
  name: string;
  number: number | null;
  arcana: TarotCardArcana;
  suit: TarotCardSuit | null;
  element: TarotCardElement | null; // Элемент карты
  astrology: {
    planet?: TarotCardPlanet | null;
    zodiac?: TarotCardZodiac | null;
  } | null;
  images: {
    thumbnail: string;
    full: string;
    altText: string | null;
  };
  numerology?: number;
  audio?: {
    meaning?: string;
    meditation?: string;
  } | null;
  direction?: TarotCardDirection;
};

export type TTarotCard = TTarotCardBase & TTarotCardTexts;

export type TTarotCardSelectedRandomTexts = {
  meaning: string;
  advice: string;
  description: string;
  keywords: string;
  yesNo: string;
};

export type TSelectedTarotCard = TTarotCardBase &
  TTarotCardSelectedRandomTexts & {
    direction: TarotCardDirection;
  };
