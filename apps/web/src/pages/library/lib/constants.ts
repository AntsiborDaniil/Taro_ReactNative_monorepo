import { NavigationRoute, TabRoute, TRedirectPlate } from 'shared/types';
import { getImage } from '../../../shared/lib';

export const LIBRARY_PLATES: TRedirectPlate[] = [
  {
    id: 0,
    name: 'core:library.tile.dictionary.title',
    subtitle: 'core:library.tile.dictionary.subtitle',
    img: getImage(['core', `cardsDescriptions`]),
    tabRoute: TabRoute.LibraryTab,
    navigationRoute: NavigationRoute.CardsDictionary,
  },
  {
    id: 1,
    name: 'core:library.tile.history.title',
    subtitle: 'core:library.tile.history.subtitle',
    img: getImage(['core', `history`]),

    tabRoute: TabRoute.LibraryTab,
    navigationRoute: NavigationRoute.SpreadsHistory,
  },
  {
    id: 2,
    name: 'core:library.tile.favorite.title',
    subtitle: 'core:library.tile.favorite.subtitle',
    img: getImage(['core', `favoriteCards`]),
    tabRoute: TabRoute.LibraryTab,
    navigationRoute: NavigationRoute.FavoriteCards,
  },
];
