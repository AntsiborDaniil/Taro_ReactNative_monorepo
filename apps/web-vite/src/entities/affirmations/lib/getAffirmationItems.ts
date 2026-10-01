import type { TFunction } from 'i18next';
import { AffirmationCategory, type TAffirmationTexts } from '../model/types';

/** Перенесено 1-в-1 из apps/web/src/entities/affirmations/lib/getAffirmationItems.ts. */
export function getAffirmationItemsForCategory(
  t: TFunction,
  category: AffirmationCategory | null | undefined,
): TAffirmationTexts[] {
  if (!category) return [];

  const root = t('affirmations:affirmationsItems', { returnObjects: true });
  if (!root || typeof root !== 'object' || Array.isArray(root)) return [];

  const list = (root as Record<string, unknown>)[category];
  return Array.isArray(list) ? (list as TAffirmationTexts[]) : [];
}
