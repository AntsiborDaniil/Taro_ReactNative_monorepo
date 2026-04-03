import { getImage } from 'shared/lib';
import { NavigationRoute, TabRoute, TRedirectPlate } from 'shared/types';

export const CATEGORIES: TRedirectPlate[] = [
  {
    id: 'library',
    name: 'core:page.dictionary',
    img: getImage(['core', 'cardsDescriptionsBackground']),
    tabRoute: TabRoute.MainTab,
    navigationRoute: NavigationRoute.CardsDictionary,
  },
  {
    id: 'history',
    name: 'core:page.history',
    tabRoute: TabRoute.MainTab,
    navigationRoute: NavigationRoute.SpreadsHistory,
    img: getImage(['core', 'historyBackground']),
  },
  {
    id: 'favorite',
    name: 'core:page.favorite',
    tabRoute: TabRoute.MainTab,
    navigationRoute: NavigationRoute.FavoriteCards,
    img: getImage(['core', 'favoriteCardsBackground']),
  },
];
