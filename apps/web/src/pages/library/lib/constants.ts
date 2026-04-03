import { NavigationRoute, TabRoute, TRedirectPlate } from 'shared/types';
import { getImage } from '../../../shared/lib';

export const LIBRARY_PLATES: TRedirectPlate[] = [
  {
    id: 0,
    name: 'core:page.dictionary',
    img: getImage(['core', `cardsDescriptions`]),
    tabRoute: TabRoute.LibraryTab,
    navigationRoute: NavigationRoute.CardsDictionary,
    gradient: ['rgba(0, 0, 0, 0)', 'rgba(246, 192, 27, 0.36)'],
  },
  {
    id: 1,
    name: 'core:page.history',
    img: getImage(['core', `history`]),

    tabRoute: TabRoute.LibraryTab,
    navigationRoute: NavigationRoute.SpreadsHistory,
    gradient: ['rgba(0, 0, 0, 0)', 'rgba(47, 186, 216, 0.36)'],
  },
  {
    id: 2,
    name: 'core:page.favorite',
    img: getImage(['core', `favoriteCards`]),
    tabRoute: TabRoute.LibraryTab,
    navigationRoute: NavigationRoute.FavoriteCards,
    gradient: ['rgba(0, 0, 0, 0)', 'rgba(100, 152, 202, 0.36)'],
  },
];
