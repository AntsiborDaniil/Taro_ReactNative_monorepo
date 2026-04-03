import {
  choiceSpreads,
  selfDevelopmentSpreads,
  simpleSpreads,
  thematicSpreads,
  TSpread,
  universalSpreads,
} from 'shared/api';

export const FAVORITE_SPREADS: TSpread[] = [
  simpleSpreads.yesNo,
  selfDevelopmentSpreads.shadowSide,
  thematicSpreads.relationship,
  universalSpreads.celticCross,
  thematicSpreads.careerFinance,
  choiceSpreads.twoPaths,
  selfDevelopmentSpreads.mirror,
];
