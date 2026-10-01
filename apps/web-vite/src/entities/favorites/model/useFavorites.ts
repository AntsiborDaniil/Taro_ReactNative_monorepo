import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@shared/lib/store';
import { openModal } from '@shared/ui';
import { useAddFavoriteMutation, useGetFavoritesQuery, useRemoveFavoriteMutation } from '../api';
import { getLocalFavorites, toggleLocalFavorite, type FavoriteCardIds } from './local';

export type ToggleFavoriteResult = { ok: boolean; action: 'add' | 'remove' };

/**
 * Перенос apps/web/src/entities/favorites/model/useFavorites.ts —
 * авторизован → /api/favorites (RTK Query, кэш инвалидируется тегом
 * 'Favorites'); гость → localStorage (entities/favorites/model/local.ts).
 * При ошибке облака на добавлении — модалка 'favorite-like-error'
 * (см. FavoriteLikeErrorModal), как и в старом LikeCard.
 */
export function useFavorites(): {
  favoriteIds: FavoriteCardIds;
  isLoading: boolean;
  toggleFavorite: (cardId: string) => Promise<ToggleFavoriteResult>;
} {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.user.isAuthenticated);
  const sessionLoading = useAppSelector((state) => state.user.sessionLoading);

  const { data, isFetching } = useGetFavoritesQuery(undefined, { skip: !isAuthenticated });
  const [addFavorite] = useAddFavoriteMutation();
  const [removeFavorite] = useRemoveFavoriteMutation();

  const [localFavorites, setLocalFavorites] = useState<FavoriteCardIds>(() => getLocalFavorites());

  // После логина локальные избранные больше не источник истины — облако
  // главнее (так же, как reloadFavorites по TAROT_AUTH_CHANGED_EVENT в старом хуке).
  useEffect(() => {
    if (!isAuthenticated) {
      setLocalFavorites(getLocalFavorites());
    }
  }, [isAuthenticated]);

  const favoriteIds = useMemo<FavoriteCardIds>(() => {
    if (isAuthenticated) {
      const record: FavoriteCardIds = {};
      for (const id of data?.cardIds ?? []) record[id] = true;
      return record;
    }
    return localFavorites;
  }, [isAuthenticated, data, localFavorites]);

  const toggleFavorite = useCallback(
    async (cardId: string): Promise<ToggleFavoriteResult> => {
      const wasLiked = Boolean(favoriteIds[cardId]);
      const action: 'add' | 'remove' = wasLiked ? 'remove' : 'add';

      if (!isAuthenticated || sessionLoading) {
        const result = toggleLocalFavorite(cardId);
        setLocalFavorites(result.next);
        return { ok: true, action: result.action };
      }

      try {
        if (action === 'add') {
          await addFavorite(cardId).unwrap();
        } else {
          await removeFavorite(cardId).unwrap();
        }
        return { ok: true, action };
      } catch {
        if (action === 'add') {
          dispatch(openModal({ id: 'favorite-like-error' }));
        }
        return { ok: false, action };
      }
    },
    [favoriteIds, isAuthenticated, sessionLoading, addFavorite, removeFavorite, dispatch],
  );

  return { favoriteIds, isLoading: isAuthenticated ? isFetching : false, toggleFavorite };
}
