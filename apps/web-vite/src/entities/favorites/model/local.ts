const STORAGE_KEY = 'favoriteCards';

export type FavoriteCardIds = Record<string, boolean>;

/**
 * Гостевое избранное — localStorage, тот же ключ, что и
 * AsyncMemoryKey.FavoriteCards ('favoriteCards') в apps/web
 * (apps/web/src/shared/lib/deviceMemory/keys.ts): на web AsyncStorage там же
 * пишет в localStorage под этим именем, так что формат совместим.
 */
export function getLocalFavorites(): FavoriteCardIds {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as FavoriteCardIds) : {};
  } catch {
    return {};
  }
}

export function setLocalFavorites(next: FavoriteCardIds): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore (quota/private mode)
  }
}

export function toggleLocalFavorite(cardId: string): { next: FavoriteCardIds; action: 'add' | 'remove' } {
  const current = getLocalFavorites();
  const next: FavoriteCardIds = { ...current };
  const isLiked = Boolean(current[cardId]);
  if (isLiked) {
    delete next[cardId];
  } else {
    next[cardId] = true;
  }
  setLocalFavorites(next);
  return { next, action: isLiked ? 'remove' : 'add' };
}
