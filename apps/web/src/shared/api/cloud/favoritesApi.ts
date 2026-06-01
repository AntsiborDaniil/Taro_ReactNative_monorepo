import { cloudFetch } from './cloudFetch';
import type { CloudFavoritesResponse } from './types';

export async function fetchCloudFavoriteIds(): Promise<string[] | null> {
  const result = await cloudFetch<CloudFavoritesResponse>('/api/favorites');
  if (!result.ok) {
    return null;
  }
  return result.data.cardIds;
}

export async function addCloudFavorite(cardId: string): Promise<boolean> {
  const result = await cloudFetch<{ ok: boolean }>('/api/favorites', {
    method: 'POST',
    body: JSON.stringify({ cardId }),
  });
  return result.ok;
}

export async function removeCloudFavorite(cardId: string): Promise<boolean> {
  const result = await cloudFetch<{ ok: boolean }>(
    `/api/favorites/${encodeURIComponent(cardId)}`,
    { method: 'DELETE' }
  );
  return result.ok;
}

export function favoriteIdsToRecord(
  cardIds: string[]
): Record<string, boolean> {
  return cardIds.reduce<Record<string, boolean>>((acc, id) => {
    acc[id] = true;
    return acc;
  }, {});
}
