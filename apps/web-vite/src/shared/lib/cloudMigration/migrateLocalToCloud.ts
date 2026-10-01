import { store } from '@app/store';
import { favoritesApi, getLocalFavorites } from '@entities/favorites';
import { DEFAULT_SETTINGS, getLocalSettings, settingsApi } from '@entities/settings';
import { getLastLocalPackIndex, getLocalHistoryPack, spreadApi } from '@entities/spread';

const MIGRATION_KEY_PREFIX = 'tarotCloudMigrationDone:';

function migrationKey(userId: string): string {
  return `${MIGRATION_KEY_PREFIX}${userId}`;
}

/**
 * Перенос apps/web/src/shared/lib/cloudMigration/migrateLocalToCloud.ts —
 * после первого логина переносим гостевые данные (история/избранное/
 * настройки) в облако. AsyncStorage → localStorage (web-vite всегда web).
 * Вызывается один раз на userId (см. entities/user/index.ts.migrationKey)
 * из Auth.tsx после applyAuthenticatedSession.
 */
export async function migrateLocalDataToCloud(userId: string): Promise<void> {
  if (typeof window === 'undefined' || !userId) return;

  let done = false;
  try {
    done = window.localStorage.getItem(migrationKey(userId)) === '1';
  } catch {
    done = false;
  }
  if (done) return;

  try {
    const lastPackIndex = getLastLocalPackIndex();
    for (let packIndex = 0; packIndex <= lastPackIndex; packIndex += 1) {
      const pack = getLocalHistoryPack(packIndex);
      for (const spread of pack) {
        await store.dispatch(spreadApi.endpoints.createSpreadHistory.initiate(spread)).unwrap().catch(() => undefined);
      }
    }

    const localFavorites = getLocalFavorites();
    const cloudFavoritesResult = await store
      .dispatch(favoritesApi.endpoints.getFavorites.initiate(undefined, { forceRefetch: true }))
      .unwrap()
      .catch(() => ({ cardIds: [] as string[] }));
    const cloudFavoriteIds = cloudFavoritesResult.cardIds ?? [];

    await Promise.all(
      Object.keys(localFavorites)
        .filter((cardId) => localFavorites[cardId] && !cloudFavoriteIds.includes(cardId))
        .map((cardId) =>
          store.dispatch(favoritesApi.endpoints.addFavorite.initiate(cardId)).unwrap().catch(() => undefined),
        ),
    );

    const cloudSettings = await store
      .dispatch(settingsApi.endpoints.getSettings.initiate(undefined, { forceRefetch: true }))
      .unwrap()
      .catch(() => null);
    const localSettings = getLocalSettings();

    const cloudIsEmpty = !cloudSettings || JSON.stringify(cloudSettings) === JSON.stringify(DEFAULT_SETTINGS);

    if (cloudIsEmpty && localSettings) {
      await store.dispatch(settingsApi.endpoints.saveSettings.initiate(localSettings)).unwrap().catch(() => undefined);
    }

    window.localStorage.setItem(migrationKey(userId), '1');
  } catch (error) {
    console.error('Cloud migration failed:', error);
  }
}
