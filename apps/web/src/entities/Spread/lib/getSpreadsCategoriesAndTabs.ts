import {
  SpreadsCategory,
  spreadsData,
  TSpread,
  TSpreadCategory,
} from 'shared/api';

export type TSpreadTab = {
  name: string;
  id: SpreadsCategory;
};

export type TSpreadSection = {
  title: string;
  data: TSpread[];
};

type TSpreadsResult = {
  spreadsDictionary: Partial<Record<SpreadsCategory, TSpread[]>>;
  spreadsTabs: TSpreadTab[];
  spreadsSections: TSpreadSection[];
};

export function getSpreadsCategoriesAndTabs(): TSpreadsResult {
  return spreadsData.reduce<TSpreadsResult>(
    (acc: TSpreadsResult, currentValue: TSpreadCategory) => {
      return {
        spreadsDictionary: {
          ...acc.spreadsDictionary,
          [currentValue.id]: currentValue.spreads,
        },
        spreadsTabs: [
          ...acc.spreadsTabs,
          { name: currentValue.name, id: currentValue.id },
        ],
        spreadsSections: [
          ...acc.spreadsSections,
          { title: currentValue.name, data: currentValue.spreads },
        ],
      };
    },
    { spreadsDictionary: {}, spreadsTabs: [], spreadsSections: [] }
  );
}
