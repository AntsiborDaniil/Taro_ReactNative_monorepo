import { SubscriptionType } from '../user';
import { SpreadName, SpreadsCategory, TSpread, TSpreadCategory } from './types';

// TODO затипизировать расклады получше, чтобы не было string, TSpread

export const simpleSpreads: Record<string, TSpread> = {
  yesNo: {
    name: 'spread:yesNo.name',
    description: '',
    id: SpreadName.Simple_YesNo,
    category: SpreadsCategory.Simple,
    img: '',
    cardsCount: 1,
    cardsPosition: [],
    selectedCards: [],
    availableSubscriptions: [
      SubscriptionType.Freemium,
      SubscriptionType.Practice,
    ],
    cardsOrder: [],
  },
  daySuggest: {
    name: 'spread:daySuggest.name',
    description: '',
    id: SpreadName.Simple_DaySuggest,
    category: SpreadsCategory.Simple,
    img: '',
    cardsCount: 1,
    cardsPosition: [],
    selectedCards: [],
    availableSubscriptions: [
      SubscriptionType.Freemium,
      SubscriptionType.Practice,
    ],
    cardsOrder: [],
  },
};

export const thematicSpreads: Record<string, TSpread> = {
  relationship: {
    name: 'spread:thematic_relationship.name',
    description: 'spread:thematic_relationship.description',
    id: SpreadName.Thematic_Relationship,
    category: SpreadsCategory.Thematic,
    img: '',
    cardsCount: 6,
    cardsPosition: [],
    selectedCards: [],
    availableSubscriptions: [SubscriptionType.Practice],
    cardsOrder: [
      {
        meaning: 'thematic_relationship.сardMeaning.0',
      },
      {
        meaning: 'thematic_relationship.сardMeaning.1',
      },
      {
        meaning: 'thematic_relationship.сardMeaning.2',
      },
      {
        meaning: 'thematic_relationship.сardMeaning.3',
      },
      {
        meaning: 'thematic_relationship.сardMeaning.4',
      },
      {
        meaning: 'thematic_relationship.сardMeaning.5',
      },
    ],
  },
  careerFinance: {
    name: 'spread:thematic_careerFinance.name',
    description: 'spread:thematic_careerFinance.description',
    id: SpreadName.Thematic_CareerFinance,
    category: SpreadsCategory.Thematic,
    img: '',
    cardsCount: 9,
    cardsPosition: [],
    selectedCards: [],
    availableSubscriptions: [SubscriptionType.Practice],
    cardsOrder: [
      {
        meaning: 'thematic_careerFinance.сardMeaning.0',
      },
      {
        meaning: 'thematic_careerFinance.сardMeaning.1',
      },
      {
        meaning: 'thematic_careerFinance.сardMeaning.2',
      },
      {
        meaning: 'thematic_careerFinance.сardMeaning.3',
      },
      {
        meaning: 'thematic_careerFinance.сardMeaning.4',
      },
      {
        meaning: 'thematic_careerFinance.сardMeaning.5',
      },
      {
        meaning: 'thematic_careerFinance.сardMeaning.6',
      },
      {
        meaning: 'thematic_careerFinance.сardMeaning.7',
      },
      {
        meaning: 'thematic_careerFinance.сardMeaning.8',
      },
    ],
  },
  love: {
    name: 'spread:thematic_love.name',
    description: 'spread:thematic_love.description',
    id: SpreadName.Thematic_Love,
    category: SpreadsCategory.Thematic,
    img: '',
    cardsCount: 6,
    cardsPosition: [],
    selectedCards: [],
    availableSubscriptions: [SubscriptionType.Practice],
    cardsOrder: [
      {
        meaning: 'thematic_love.сardMeaning.0',
      },
      {
        meaning: 'thematic_love.сardMeaning.1',
      },
      {
        meaning: 'thematic_love.сardMeaning.2',
      },
      {
        meaning: 'thematic_love.сardMeaning.3',
      },
      {
        meaning: 'thematic_love.сardMeaning.4',
      },
      {
        meaning: 'thematic_love.сardMeaning.5',
      },
    ],
  },
};

export const universalSpreads: Record<string, TSpread> = {
  celticCross: {
    name: 'spread:universal_celticCross.name',
    description: 'spread:universal_celticCross.description',
    id: SpreadName.Universal_CelticCross,
    category: SpreadsCategory.Universal,
    img: '',
    cardsCount: 10,
    horizontalPosition: [0],
    cardsPosition: [],
    selectedCards: [],
    availableSubscriptions: [SubscriptionType.Practice],
    cardsOrder: [
      {
        meaning: 'universal_celticCross.сardMeaning.0',
      },
      {
        meaning: 'universal_celticCross.сardMeaning.1',
      },
      {
        meaning: 'universal_celticCross.сardMeaning.2',
      },
      {
        meaning: 'universal_celticCross.сardMeaning.3',
      },
      {
        meaning: 'universal_celticCross.сardMeaning.4',
      },
      {
        meaning: 'universal_celticCross.сardMeaning.5',
      },
      {
        meaning: 'universal_celticCross.сardMeaning.6',
      },
      {
        meaning: 'universal_celticCross.сardMeaning.7',
      },
      {
        meaning: 'universal_celticCross.сardMeaning.8',
      },
      {
        meaning: 'universal_celticCross.сardMeaning.9',
      },
    ],
  },
  pyramid: {
    name: 'spread:universal_pyramid.name',
    description: 'spread:universal_pyramid.description',
    id: SpreadName.Universal_Pyramid,
    category: SpreadsCategory.Universal,
    img: '',
    cardsCount: 10,
    cardsPosition: [],
    selectedCards: [],
    availableSubscriptions: [SubscriptionType.Practice],
    cardsOrder: [
      {
        meaning: 'universal_pyramid.сardMeaning.0',
      },
      {
        meaning: 'universal_pyramid.сardMeaning.1',
      },
      {
        meaning: 'universal_pyramid.сardMeaning.2',
      },
      {
        meaning: 'universal_pyramid.сardMeaning.3',
      },
      {
        meaning: 'universal_pyramid.сardMeaning.4',
      },
      {
        meaning: 'universal_pyramid.сardMeaning.5',
      },
      {
        meaning: 'universal_pyramid.сardMeaning.6',
      },
      {
        meaning: 'universal_pyramid.сardMeaning.7',
      },
      {
        meaning: 'universal_pyramid.сardMeaning.8',
      },
      {
        meaning: 'universal_pyramid.сardMeaning.9',
      },
    ],
  },
  // flame: {
  //   name: 'spread:universal_flame.name',
  //   description: 'spread:universal_flame.description',
  //   id: SpreadName.Universal_Flame,
  //   category: SpreadsCategory.Universal,
  //   img: '',
  //   cardsCount: 12,
  //   cardsPosition: [],
  //   selectedCards: [],
  //   availableSubscriptions: [SubscriptionType.Practice],
  //   cardsOrder: [
  //     {
  //       meaning: 'universal_flame.сardMeaning.0',
  //     },
  //     {
  //       meaning: 'universal_flame.сardMeaning.1',
  //     },
  //     {
  //       meaning: 'universal_flame.сardMeaning.2',
  //     },
  //     {
  //       meaning: 'universal_flame.сardMeaning.3',
  //     },
  //     {
  //       meaning: 'universal_flame.сardMeaning.4',
  //     },
  //     {
  //       meaning: 'universal_flame.сardMeaning.5',
  //     },
  //     {
  //       meaning: 'universal_flame.сardMeaning.6',
  //     },
  //     {
  //       meaning: 'universal_flame.сardMeaning.7',
  //     },
  //     {
  //       meaning: 'universal_flame.сardMeaning.8',
  //     },
  //     {
  //       meaning: 'universal_flame.сardMeaning.9',
  //     },
  //     {
  //       meaning: 'universal_flame.сardMeaning.10',
  //     },
  //     {
  //       meaning: 'universal_flame.сardMeaning.11',
  //     },
  //   ],
  // },
  horseshoe: {
    name: 'spread:universal_horseshoe.name',
    description: 'spread:universal_horseshoe.description',
    id: SpreadName.Universal_Horseshoe,
    category: SpreadsCategory.Universal,
    img: '',
    cardsCount: 7,
    cardsPosition: [],
    selectedCards: [],
    availableSubscriptions: [SubscriptionType.Practice],
    cardsOrder: [
      {
        meaning: 'universal_horseshoe.сardMeaning.0',
      },
      {
        meaning: 'universal_horseshoe.сardMeaning.1',
      },
      {
        meaning: 'universal_horseshoe.сardMeaning.2',
      },
      {
        meaning: 'universal_horseshoe.сardMeaning.3',
      },
      {
        meaning: 'universal_horseshoe.сardMeaning.4',
      },
      {
        meaning: 'universal_horseshoe.сardMeaning.5',
      },
      {
        meaning: 'universal_horseshoe.сardMeaning.6',
      },
    ],
  },
};

export const selfDevelopmentSpreads: Record<string, TSpread> = {
  mirror: {
    name: 'spread:selfDevelopment_mirror.name',
    description: 'spread:selfDevelopment_mirror.description',
    id: SpreadName.SelfDevelopment_Mirror,
    category: SpreadsCategory.SelfDevelopment,
    img: '',
    cardsCount: 10,
    cardsPosition: [],
    selectedCards: [],
    availableSubscriptions: [SubscriptionType.Practice],
    cardsOrder: [
      {
        meaning: 'selfDevelopment_mirror.сardMeaning.0',
      },
      {
        meaning: 'selfDevelopment_mirror.сardMeaning.1',
      },
      {
        meaning: 'selfDevelopment_mirror.сardMeaning.2',
      },
      {
        meaning: 'selfDevelopment_mirror.сardMeaning.3',
      },
      {
        meaning: 'selfDevelopment_mirror.сardMeaning.4',
      },
      {
        meaning: 'selfDevelopment_mirror.сardMeaning.5',
      },
      {
        meaning: 'selfDevelopment_mirror.сardMeaning.6',
      },
      {
        meaning: 'selfDevelopment_mirror.сardMeaning.7',
      },
      {
        meaning: 'selfDevelopment_mirror.сardMeaning.8',
      },
      {
        meaning: 'selfDevelopment_mirror.сardMeaning.9',
      },
    ],
  },
  shadowSide: {
    name: 'spread:selfDevelopment_shadowSide.name',
    description: 'spread:selfDevelopment_shadowSide.description',
    id: SpreadName.SelfDevelopment_ShadowSide,
    category: SpreadsCategory.SelfDevelopment,
    img: '',
    cardsCount: 5,
    cardsPosition: [],
    selectedCards: [],
    availableSubscriptions: [
      SubscriptionType.Freemium,
      SubscriptionType.Practice,
    ],
    cardsOrder: [
      {
        meaning: 'selfDevelopment_shadowSide.сardMeaning.0',
      },
      {
        meaning: 'selfDevelopment_shadowSide.сardMeaning.1',
      },
      {
        meaning: 'selfDevelopment_shadowSide.сardMeaning.2',
      },
      {
        meaning: 'selfDevelopment_shadowSide.сardMeaning.3',
      },
      {
        meaning: 'selfDevelopment_shadowSide.сardMeaning.4',
      },
    ],
  },
};

export const choiceSpreads: Record<string, TSpread> = {
  twoPaths: {
    name: 'spread:choice_twoPaths.name',
    description: 'spread:choice_twoPaths.description',
    id: SpreadName.Choice_TwoPaths,
    category: SpreadsCategory.Choice,
    img: '',
    cardsCount: 7,
    cardsPosition: [],
    selectedCards: [],
    availableSubscriptions: [SubscriptionType.Practice],
    cardsOrder: [
      {
        meaning: 'choice_twoPaths.сardMeaning.0',
      },
      {
        meaning: 'choice_twoPaths.сardMeaning.1',
      },
      {
        meaning: 'choice_twoPaths.сardMeaning.2',
      },
      {
        meaning: 'choice_twoPaths.сardMeaning.3',
      },
      {
        meaning: 'choice_twoPaths.сardMeaning.4',
      },
      {
        meaning: 'choice_twoPaths.сardMeaning.5',
      },
      {
        meaning: 'choice_twoPaths.сardMeaning.6',
      },
    ],
  },
  crossroad: {
    name: 'spread:choice_crossroad.name',
    description: 'spread:choice_crossroad.description',
    id: SpreadName.Choice_Crossroad,
    category: SpreadsCategory.Choice,
    img: '',
    cardsCount: 9,
    cardsPosition: [],
    selectedCards: [],
    availableSubscriptions: [SubscriptionType.Practice],
    cardsOrder: [
      {
        meaning: 'choice_crossroad.сardMeaning.0',
      },
      {
        meaning: 'choice_crossroad.сardMeaning.1',
      },
      {
        meaning: 'choice_crossroad.сardMeaning.2',
      },
      {
        meaning: 'choice_crossroad.сardMeaning.3',
      },
      {
        meaning: 'choice_crossroad.сardMeaning.4',
      },
      {
        meaning: 'choice_crossroad.сardMeaning.5',
      },
      {
        meaning: 'choice_crossroad.сardMeaning.6',
      },
      {
        meaning: 'choice_crossroad.сardMeaning.7',
      },
      {
        meaning: 'choice_crossroad.сardMeaning.8',
      },
    ],
  },
};

export const spreadsDataNames = {
  [SpreadsCategory.Choice]: 'spread:choice.name',
  [SpreadsCategory.Simple]: 'spread:simple.name',
  [SpreadsCategory.SelfDevelopment]: 'spread:selfDevelopment.name',
  [SpreadsCategory.Universal]: 'spread:universal.name',
  [SpreadsCategory.Thematic]: 'spread:thematic.name',
};

export const spreadsData: TSpreadCategory[] = [
  {
    name: 'spread:simple.name.multiple',
    id: SpreadsCategory.Simple,
    spreads: [simpleSpreads.yesNo, simpleSpreads.daySuggest],
  },
  {
    name: 'spread:selfDevelopment.name.multiple',
    id: SpreadsCategory.SelfDevelopment,
    spreads: [selfDevelopmentSpreads.shadowSide, selfDevelopmentSpreads.mirror],
  },
  {
    name: 'spread:thematic.name.multiple',
    id: SpreadsCategory.Thematic,
    spreads: [
      thematicSpreads.relationship,
      thematicSpreads.careerFinance,
      thematicSpreads.love,
    ],
  },
  {
    name: 'spread:universal.name.multiple',
    id: SpreadsCategory.Universal,
    spreads: [
      universalSpreads.celticCross,
      universalSpreads.pyramid,
      // universalSpreads.flame,
      universalSpreads.horseshoe,
    ],
  },
  {
    name: 'spread:choice.name.multiple',
    id: SpreadsCategory.Choice,
    spreads: [choiceSpreads.twoPaths, choiceSpreads.crossroad],
  },
];
