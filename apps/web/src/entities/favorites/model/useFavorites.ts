import { useEffect, useState } from 'react';
import { TSelectedTarotCard, TTarotCard } from 'shared/api';
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
};

export function useFavorites(): TFavoritesHookResult {
  const [favoritesCardsIds, setFavoritesCardsIds] =
    useState<TSavedFavoriteCardsIds>({});

  const addOrRemoveFavoriteCard = async (
    card: TTarotCard | TSelectedTarotCard
  ) => {
    const newSavedCardsIds = await saveFavoriteCard(card.id);

    setFavoritesCardsIds(newSavedCardsIds);
  };

  useEffect(() => {
    async function loadFavoriteCards() {
      const fetchedFavoriteCards = await getFavoriteCards();

      if (fetchedFavoriteCards) {
        setFavoritesCardsIds(fetchedFavoriteCards);
      }
    }

    loadFavoriteCards();
  }, []);

  return { favoritesCardsIds, addOrRemoveFavoriteCard };
}
