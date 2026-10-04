import {
  choiceSpreads,
  selfDevelopmentSpreads,
  simpleSpreads,
  spreadsData,
  thematicSpreads,
  universalSpreads,
  type TSpread,
  type TSpreadCategory,
} from '@legacy-data';

export type { TSpread, TSpreadCategory };
export { SpreadName, SpreadsCategory } from '@legacy-data';

export type SpreadSection = {
  title: string;
  data: TSpread[];
};

/**
 * Перенос 1-в-1 apps/web/src/entities/Spread/lib/getSpreadsCategoriesAndTabs.ts
 * (только секции каталога — вкладки/словарь тут не используются). Данные из
 * spreadsData (@legacy-data) — не копируются.
 */
export const SPREAD_SECTIONS: SpreadSection[] = spreadsData.map((category: TSpreadCategory) => ({
  title: category.name,
  data: category.spreads,
}));

/** apps/web/src/pages/main/lib/constants/spreads.constants.ts — 1-в-1 (подборка для главной). */
export const FAVORITE_SPREADS: TSpread[] = [
  simpleSpreads.yesNo,
  selfDevelopmentSpreads.shadowSide,
  thematicSpreads.relationship,
  thematicSpreads.boundaries,
  thematicSpreads.betweenUs,
  universalSpreads.celticCross,
  thematicSpreads.careerFinance,
  choiceSpreads.twoPaths,
  selfDevelopmentSpreads.mirror,
];

export const DAY_ADVICE_SPREAD: TSpread = simpleSpreads.daySuggest;

/** Плоский список всех раскладов каталога — для поиска по id (deep link / прямой заход на /spreads/:id). */
export const ALL_SPREADS: TSpread[] = SPREAD_SECTIONS.flatMap((section) => section.data);

export function findSpreadById(id: string | undefined): TSpread | null {
  if (!id) return null;
  return ALL_SPREADS.find((item) => item.id === id) ?? null;
}
