import { createContext } from 'react';
import { TFavoritesHookResult } from './useFavorites';

type TFavoritesContext = TFavoritesHookResult;

export const FavoritesContext = createContext<Partial<TFavoritesContext>>({});
