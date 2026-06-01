import { useCallback, useEffect, useState } from 'react';
import { TSelectedTarotCard, TTarotCard } from 'shared/api';
import { TAROT_AUTH_CHANGED_EVENT } from 'shared/lib/tarotAuthEvents';
import {
  getFavoriteCards,
  saveFavoriteCard,
  TSavedFavoriteCardsIds,
} from '../lib';

export type TFavoritesHookResult = {
  favoritesCardsIds: TSavedFavoriteCardsIds;
  addOrRemoveFavoriteCard: (
    card: TTarotCard | TSelectedTarotCard
  ) => Promise<void>;
  reloadFavorites: () => Promise<void>;
};

export function useFavorites(): TFavoritesHookResult {
  const [favoritesCardsIds, setFavoritesCardsIds] =
    useState<TSavedFavoriteCardsIds>({});

  const reloadFavorites = useCallback(async () => {
    const fetchedFavoriteCards = await getFavoriteCards();
    setFavoritesCardsIds(fetchedFavoriteCards);
  }, []);

  const addOrRemoveFavoriteCard = async (
    card: TTarotCard | TSelectedTarotCard
  ) => {
    const newSavedCardsIds = await saveFavoriteCard(card.id);
    setFavoritesCardsIds(newSavedCardsIds);
  };

  useEffect(() => {
    void reloadFavorites();
  }, [reloadFavorites]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const onAuthChanged = () => {
      void reloadFavorites();
    };

    window.addEventListener(TAROT_AUTH_CHANGED_EVENT, onAuthChanged);
    return () => {
      window.removeEventListener(TAROT_AUTH_CHANGED_EVENT, onAuthChanged);
    };
  }, [reloadFavorites]);

  return { favoritesCardsIds, addOrRemoveFavoriteCard, reloadFavorites };
}
