import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@shared/lib/store';
import { openModal } from '@shared/ui';
import { useAddFavoriteMutation, useGetFavoritesQuery, useRemoveFavoriteMutation } from '../api';
import { getLocalFavorites, toggleLocalFavorite, type FavoriteCardIds } from './local';

export type ToggleFavoriteResult = {
  ok: boolean;
  action: 'add' | 'remove';
  /** Повторный клик, пока запрос ещё летит — состояние не меняем. */
  ignored?: boolean;
};

/**
 * Перенос apps/web/src/entities/favorites/model/useFavorites.ts —
 * авторизован → /api/favorites (RTK Query, кэш инвалидируется тегом
 * 'Favorites'); гость → localStorage (entities/favorites/model/local.ts).
 * При ошибке облака на добавлении — модалка 'favorite-like-error'
 * (см. FavoriteLikeErrorModal), как и в старом LikeCard.
 * Лайк оптимистичный: favoriteIds меняется до ответа API, при ошибке откатывается.
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
  /** cardId → желаемый лайк, пока сервер (или localStorage) не догнал клик. */
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const inFlightRef = useRef<Set<string>>(new Set());

  // После логина локальные избранные больше не источник истины — облако
  // главнее (так же, как reloadFavorites по TAROT_AUTH_CHANGED_EVENT в старом хуке).
  useEffect(() => {
    if (!isAuthenticated) {
      setLocalFavorites(getLocalFavorites());
    }
  }, [isAuthenticated]);

  const baseIds = useMemo<FavoriteCardIds>(() => {
    if (isAuthenticated) {
      const record: FavoriteCardIds = {};
      for (const id of data?.cardIds ?? []) record[id] = true;
      return record;
    }
    return localFavorites;
  }, [isAuthenticated, data, localFavorites]);

  const favoriteIds = useMemo<FavoriteCardIds>(() => {
    const keys = Object.keys(overrides);
    if (keys.length === 0) return baseIds;
    const merged: FavoriteCardIds = { ...baseIds };
    for (const id of keys) {
      if (overrides[id]) merged[id] = true;
      else delete merged[id];
    }
    return merged;
  }, [baseIds, overrides]);

  // Когда источник истины совпал с оптимистичным значением — убираем перекрытие.
  useEffect(() => {
    setOverrides((prev) => {
      const keys = Object.keys(prev);
      if (keys.length === 0) return prev;
      let changed = false;
      const next = { ...prev };
      for (const id of keys) {
        if (Boolean(baseIds[id]) === prev[id]) {
          delete next[id];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [baseIds]);

  const toggleFavorite = useCallback(
    async (cardId: string): Promise<ToggleFavoriteResult> => {
      const wasLiked = Boolean(favoriteIds[cardId]);
      const action: 'add' | 'remove' = wasLiked ? 'remove' : 'add';

      if (inFlightRef.current.has(cardId)) {
        return { ok: false, action, ignored: true };
      }

      // До любого await: класс active на сердце переключается в этом же кадре.
      setOverrides((prev) => ({ ...prev, [cardId]: !wasLiked }));

      if (!isAuthenticated || sessionLoading) {
        const result = toggleLocalFavorite(cardId);
        setLocalFavorites(result.next);
        return { ok: true, action: result.action };
      }

      inFlightRef.current.add(cardId);
      try {
        if (action === 'add') {
          await addFavorite(cardId).unwrap();
        } else {
          await removeFavorite(cardId).unwrap();
        }
        return { ok: true, action };
      } catch {
        setOverrides((prev) => {
          if (!(cardId in prev)) return prev;
          const next = { ...prev };
          delete next[cardId];
          return next;
        });
        if (action === 'add') {
          dispatch(openModal({ id: 'favorite-like-error' }));
        }
        return { ok: false, action };
      } finally {
        inFlightRef.current.delete(cardId);
      }
    },
    [favoriteIds, isAuthenticated, sessionLoading, addFavorite, removeFavorite, dispatch],
  );

  return { favoriteIds, isLoading: isAuthenticated ? isFetching : false, toggleFavorite };
}
