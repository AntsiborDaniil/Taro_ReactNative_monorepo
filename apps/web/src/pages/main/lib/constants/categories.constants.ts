import { getImage } from 'shared/lib';
import { NavigationRoute, TabRoute, TRedirectPlate } from 'shared/types';

export const CATEGORIES: TRedirectPlate[] = [
  {
    id: 'library',
    name: 'core:page.dictionary',
    img: getImage(['core', 'cardsDescriptionsBackground']),
    tabRoute: TabRoute.LibraryTab,
    navigationRoute: NavigationRoute.CardsDictionary,
  },
  {
    id: 'history',
    name: 'core:page.history',
    tabRoute: TabRoute.LibraryTab,
    navigationRoute: NavigationRoute.SpreadsHistory,
    img: getImage(['core', 'historyBackground']),
  },
  {
    id: 'favorite',
    name: 'core:page.favorite',
    tabRoute: TabRoute.LibraryTab,
    navigationRoute: NavigationRoute.FavoriteCards,
    img: getImage(['core', 'favoriteCardsBackground']),
  },
];
