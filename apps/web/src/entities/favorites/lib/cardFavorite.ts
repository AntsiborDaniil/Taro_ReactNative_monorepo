import {
  AsyncMemoryKey,
  getValueForAsyncDeviceMemoryKey,
  saveAsyncDeviceMemoryKey,
} from 'shared/lib/deviceMemory';
import { Platform } from 'react-native';
import {
  addCloudFavorite,
  favoriteIdsToRecord,
  fetchCloudFavoriteIds,
  removeCloudFavorite,
} from 'shared/api/cloud';

export type TSavedFavoriteCardsIds = Record<string, boolean>;

async function loadLocalFavorites(): Promise<TSavedFavoriteCardsIds> {
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

async function saveLocalFavorites(
  favorites: TSavedFavoriteCardsIds
): Promise<void> {
  await saveAsyncDeviceMemoryKey<TSavedFavoriteCardsIds>(
    AsyncMemoryKey.FavoriteCards,
    favorites
  );
}

export async function saveFavoriteCard(
  cardId: string
): Promise<TSavedFavoriteCardsIds> {
  try {
    const current = await getFavoriteCards();
    const isLiked = !!current[cardId];
    const next: TSavedFavoriteCardsIds = { ...current };

    if (isLiked) {
      delete next[cardId];
    } else {
      next[cardId] = true;
    }

    await saveLocalFavorites(next);

    if (Platform.OS === 'web') {
      if (isLiked) {
        await removeCloudFavorite(cardId);
      } else {
        await addCloudFavorite(cardId);
      }
    }

    return next;
  } catch (error) {
    console.error('Не удалось сохранить избранную карту:', error);
    return {};
  }
}

export async function getFavoriteCards(): Promise<TSavedFavoriteCardsIds> {
  if (Platform.OS === 'web') {
    const cloudIds = await fetchCloudFavoriteIds();
    if (cloudIds !== null) {
      const cloudFavorites = favoriteIdsToRecord(cloudIds);
      await saveLocalFavorites(cloudFavorites);
      return cloudFavorites;
    }
  }

  return loadLocalFavorites();
}
