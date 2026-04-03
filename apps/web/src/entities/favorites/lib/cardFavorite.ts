import {
  AsyncMemoryKey,
  getValueForAsyncDeviceMemoryKey,
  saveAsyncDeviceMemoryKey,
} from 'shared/lib/deviceMemory';

export type TSavedFavoriteCardsIds = Record<string, boolean>;

export async function saveFavoriteCard(
  cardId: string
): Promise<TSavedFavoriteCardsIds> {
  try {
    const favoriteCards =
      (await getValueForAsyncDeviceMemoryKey<TSavedFavoriteCardsIds>(
        AsyncMemoryKey.FavoriteCards
      )) || {};

    const newFavorites = { ...favoriteCards, [cardId]: !favoriteCards[cardId] };

    await saveAsyncDeviceMemoryKey<TSavedFavoriteCardsIds>(
      AsyncMemoryKey.FavoriteCards,
      newFavorites
    );

    return newFavorites;
  } catch (error) {
    console.error('Не удалось сохранить избранную карту:', error);
    return {};
  }
}

export async function getFavoriteCards(): Promise<TSavedFavoriteCardsIds> {
  try {
    return (
      (await getValueForAsyncDeviceMemoryKey<TSavedFavoriteCardsIds>(
        AsyncMemoryKey.FavoriteCards
      )) || {}
    );
  } catch (error) {
    console.error('не удалось получить избранные карты:', error);

    return {};
  }
}
