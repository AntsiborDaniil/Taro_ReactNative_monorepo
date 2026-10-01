import { useCallback, useState } from 'react';
import type { TFunction } from 'i18next';
import { useAppSelector } from '@shared/lib/store';
import { getDateISO } from '@shared/lib/date';
import { getAffirmationItemsForCategory } from '../lib/getAffirmationItems';
import { AffirmationCategory, type TSavedAffirmations, type TSelectedAffirmation } from './types';

const SAVED_KEY = 'SelectedAffirmations';
export const CATEGORY_STORAGE_KEY = 'SelectedAffirmationCategory';

function readSaved(): TSavedAffirmations {
  try {
    const raw = window.localStorage.getItem(SAVED_KEY);
    return raw ? (JSON.parse(raw) as TSavedAffirmations) : {};
  } catch {
    return {};
  }
}

function writeSaved(value: TSavedAffirmations): void {
  try {
    window.localStorage.setItem(SAVED_KEY, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function readRememberedCategory(): AffirmationCategory | null {
  try {
    return window.localStorage.getItem(CATEGORY_STORAGE_KEY) as AffirmationCategory | null;
  } catch {
    return null;
  }
}

export type TAffirmationsHookResult = {
  selectedCategory: AffirmationCategory | null;
  selectedAffirmation: TSelectedAffirmation | null;
  canAccessCategory: (category: AffirmationCategory) => boolean;
  selectCategory: (category: AffirmationCategory, t: TFunction) => void;
};

/**
 * Перенос apps/web/src/entities/affirmations/model/useAffirmations.ts —
 * выбор случайной аффирмации категории (кэш на день, localStorage,
 * 1-в-1 ключи AsyncMemoryKey.SelectedAffirmations/SelectedAffirmationCategory).
 * Доступ к категориям кроме General — только авторизованным.
 */
export function useAffirmations(): TAffirmationsHookResult {
  const isAuthenticated = useAppSelector((state) => state.user.isAuthenticated);
  const [selectedCategory, setSelectedCategory] = useState<AffirmationCategory | null>(null);
  const [selectedAffirmation, setSelectedAffirmation] = useState<TSelectedAffirmation | null>(null);

  const canAccessCategory = useCallback(
    (category: AffirmationCategory) => category === AffirmationCategory.General || Boolean(isAuthenticated),
    [isAuthenticated],
  );

  const selectCategory = useCallback(
    (category: AffirmationCategory, t: TFunction) => {
      if (!canAccessCategory(category)) return;

      setSelectedCategory(category);

      const today = getDateISO(new Date());
      const saved = readSaved();
      const existing = saved[today]?.[category];
      if (existing) {
        setSelectedAffirmation(existing);
        return;
      }

      const items = getAffirmationItemsForCategory(t, category);
      if (!items.length) {
        setSelectedAffirmation(null);
        return;
      }

      const newAffirmation: TSelectedAffirmation = { texts: items[Math.floor(Math.random() * items.length)] };
      setSelectedAffirmation(newAffirmation);
      writeSaved({ ...saved, [today]: { ...(saved[today] ?? {}), [category]: newAffirmation } });
      try {
        window.localStorage.setItem(CATEGORY_STORAGE_KEY, category);
      } catch {
        /* ignore */
      }
    },
    [canAccessCategory],
  );

  return { selectedCategory, selectedAffirmation, canAccessCategory, selectCategory };
}
