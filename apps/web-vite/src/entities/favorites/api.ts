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
      async onQueryStarted(cardId, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          favoritesApi.util.updateQueryData('getFavorites', undefined, (draft) => {
            if (!draft.cardIds.includes(cardId)) draft.cardIds.push(cardId);
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),
    removeFavorite: build.mutation<{ ok: boolean }, string>({
      query: (cardId) => ({ url: `/api/favorites/${encodeURIComponent(cardId)}`, method: 'DELETE' }),
      invalidatesTags: ['Favorites'],
      async onQueryStarted(cardId, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          favoritesApi.util.updateQueryData('getFavorites', undefined, (draft) => {
            draft.cardIds = draft.cardIds.filter((id) => id !== cardId);
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),
  }),
});

export const { useGetFavoritesQuery, useAddFavoriteMutation, useRemoveFavoriteMutation } = favoritesApi;
