import type { TFunction } from 'i18next';
import { AffirmationCategory, type TAffirmationTexts } from '../model/types';

/** Nested affirmationsItems — keySeparator:false, so read parent object then category key. */
export function getAffirmationItemsForCategory(
  t: TFunction,
  category: AffirmationCategory | null | undefined
): TAffirmationTexts[] {
  if (!category) {
    return [];
  }

  const root = t('affirmations:affirmationsItems', { returnObjects: true });

  if (!root || typeof root !== 'object' || Array.isArray(root)) {
    return [];
  }

  const list = (root as Record<string, unknown>)[category];

  return Array.isArray(list) ? (list as TAffirmationTexts[]) : [];
}
