import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getLastSpreadsPackIndex as getLocalLastPackIndex, getLocalSpreadsHistory } from 'entities/Spread';
import {
  addCloudFavorite,
  createCloudSpread,
  fetchCloudFavoriteIds,
  fetchCloudSettings,
  saveCloudSettings,
} from 'shared/api/cloud';
import {
  AsyncMemoryKey,
  getValueForAsyncDeviceMemoryKey,
} from 'shared/lib/deviceMemory';
import { TSavedFavoriteCardsIds } from 'entities/favorites/lib/cardFavorite';
import { DEFAULT_SETTINGS } from 'shared/constants';
import { TSettings } from 'shared/types';

const MIGRATION_KEY_PREFIX = 'tarotCloudMigrationDone:';

function migrationKey(userId: string): string {
  return `${MIGRATION_KEY_PREFIX}${userId}`;
}

export async function migrateLocalDataToCloud(userId: string): Promise<void> {
  if (Platform.OS !== 'web' || !userId) {
    return;
  }

  const done = await AsyncStorage.getItem(migrationKey(userId));
  if (done === '1') {
    return;
  }

  try {
    const lastPackIndex = await getLocalLastPackIndex();
    for (let packIndex = 0; packIndex <= lastPackIndex; packIndex += 1) {
      const pack = await getLocalSpreadsHistory(packIndex);
      for (const spread of pack) {
        await createCloudSpread(spread);
      }
    }

    const localFavorites =
      (await getValueForAsyncDeviceMemoryKey<TSavedFavoriteCardsIds>(
        AsyncMemoryKey.FavoriteCards
      )) ?? {};
    const cloudFavoriteIds = (await fetchCloudFavoriteIds()) ?? [];

    await Promise.all(
      Object.keys(localFavorites)
        .filter((cardId) => localFavorites[cardId] && !cloudFavoriteIds.includes(cardId))
        .map((cardId) => addCloudFavorite(cardId))
    );

    const cloudSettings = await fetchCloudSettings();
    const localSettings =
      (await getValueForAsyncDeviceMemoryKey<TSettings>(
        AsyncMemoryKey.Settings
      )) ?? DEFAULT_SETTINGS;

    const cloudIsEmpty =
      !cloudSettings ||
      JSON.stringify(cloudSettings) === JSON.stringify(DEFAULT_SETTINGS);

    if (cloudIsEmpty && localSettings) {
      await saveCloudSettings(localSettings);
    }

    await AsyncStorage.setItem(migrationKey(userId), '1');
  } catch (error) {
    console.error('Cloud migration failed:', error);
  }
}
