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
  isCloudSessionActive,
  removeCloudFavorite,
} from 'shared/api/cloud';

export type TSavedFavoriteCardsIds = Record<string, boolean>;

export type SaveFavoriteAction = 'add' | 'remove';

export type SaveFavoriteResult = {
  ok: boolean;
  favorites: TSavedFavoriteCardsIds;
  action: SaveFavoriteAction;
};

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

function buildNextFavorites(
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

export async function saveFavoriteCard(
  cardId: string,
  currentFavorites?: TSavedFavoriteCardsIds
): Promise<SaveFavoriteResult> {
  const current = currentFavorites ?? (await getFavoriteCards());
  const { next, action } = buildNextFavorites(current, cardId);

  try {
    if (Platform.OS === 'web') {
      const usesCloud = await isCloudSessionActive();
      if (usesCloud) {
        const cloudOk =
          action === 'remove'
            ? await removeCloudFavorite(cardId)
            : await addCloudFavorite(cardId);

        if (!cloudOk) {
          return { ok: false, favorites: current, action };
        }
      }
    }

    await saveLocalFavorites(next);
    return { ok: true, favorites: next, action };
  } catch (error) {
    console.error('Не удалось сохранить избранную карту:', error);
    return { ok: false, favorites: current, action };
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
