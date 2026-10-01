import { baseApi } from '@shared/api/baseApi';

export type FavoritesResponse = { cardIds: string[] };

/**
 * Перенос apps/web/src/shared/api/cloud/favoritesApi.ts на RTK Query.
 * Требует сессию (401 без авторизации, apps/api/src/routes/favorites.ts) —
 * для гостя используется entities/favorites/model/local.ts, см.
 * useFavoriteToggle.
 */
export const favoritesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getFavorites: build.query<FavoritesResponse, void>({
      query: () => '/api/favorites',
      providesTags: ['Favorites'],
    }),
    addFavorite: build.mutation<{ ok: boolean }, string>({
      query: (cardId) => ({ url: '/api/favorites', method: 'POST', body: { cardId } }),
      invalidatesTags: ['Favorites'],
    }),
    removeFavorite: build.mutation<{ ok: boolean }, string>({
      query: (cardId) => ({ url: `/api/favorites/${encodeURIComponent(cardId)}`, method: 'DELETE' }),
      invalidatesTags: ['Favorites'],
    }),
  }),
});

export const { useGetFavoritesQuery, useAddFavoriteMutation, useRemoveFavoriteMutation } = favoritesApi;
