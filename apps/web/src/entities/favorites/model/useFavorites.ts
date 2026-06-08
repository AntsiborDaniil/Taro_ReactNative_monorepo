import { useCallback, useEffect, useState } from 'react';
import { TSelectedTarotCard, TTarotCard } from 'shared/api';
import { TAROT_AUTH_CHANGED_EVENT } from 'shared/lib/tarotAuthEvents';
import {
  getFavoriteCards,
  saveFavoriteCard,
  SaveFavoriteAction,
  TSavedFavoriteCardsIds,
} from '../lib';

export type ToggleFavoriteResult = {
  ok: boolean;
  action: SaveFavoriteAction;
};

export type TFavoritesHookResult = {
  favoritesCardsIds: TSavedFavoriteCardsIds;
  isLoading: boolean;
  addOrRemoveFavoriteCard: (
    card: TTarotCard | TSelectedTarotCard
  ) => Promise<ToggleFavoriteResult>;
  reloadFavorites: () => Promise<void>;
};

export function useFavorites(): TFavoritesHookResult {
  const [favoritesCardsIds, setFavoritesCardsIds] =
    useState<TSavedFavoriteCardsIds>({});
  const [isLoading, setIsLoading] = useState(true);

  const reloadFavorites = useCallback(async () => {
    const fetchedFavoriteCards = await getFavoriteCards();
    setFavoritesCardsIds(fetchedFavoriteCards);
  }, []);

  const addOrRemoveFavoriteCard = async (
    card: TTarotCard | TSelectedTarotCard
  ): Promise<ToggleFavoriteResult> => {
    const previous = favoritesCardsIds;
    const { next, action } = buildOptimisticFavorites(previous, card.id);

    setFavoritesCardsIds(next);

    const result = await saveFavoriteCard(card.id, previous);

    if (!result.ok) {
      setFavoritesCardsIds(result.favorites);
      return { ok: false, action: result.action };
    }

    setFavoritesCardsIds(result.favorites);
    return { ok: true, action: result.action };
  };

  useEffect(() => {
    setIsLoading(true);
    void reloadFavorites().finally(() => setIsLoading(false));
  }, [reloadFavorites]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const onAuthChanged = () => {
      setIsLoading(true);
      void reloadFavorites().finally(() => setIsLoading(false));
    };

    window.addEventListener(TAROT_AUTH_CHANGED_EVENT, onAuthChanged);
    return () => {
      window.removeEventListener(TAROT_AUTH_CHANGED_EVENT, onAuthChanged);
    };
  }, [reloadFavorites]);

  return {
    favoritesCardsIds,
    isLoading,
    addOrRemoveFavoriteCard,
    reloadFavorites,
  };
}

function buildOptimisticFavorites(
  current: TSavedFavoriteCardsIds,
  cardId: string
): { next: TSavedFavoriteCardsIds; action: SaveFavoriteAction } {
  const isLiked = !!current[cardId];
  const next: TSavedFavoriteCardsIds = { ...current };

  if (isLiked) {
    delete next[cardId];
    return { next, action: 'remove' };
  }

  next[cardId] = true;
  return { next, action: 'add' };
}
