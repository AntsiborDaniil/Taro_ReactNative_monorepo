import { getDateISO } from '@shared/lib/date';
import { MotivationKey } from './types';

/** Перенесено 1-в-1 из apps/web/src/entities/tarotMotivation/lib/helpers.ts. */
export function getMotivationMemoryKey(key: MotivationKey): string {
  return `MotivationMemoryKey_${key}_${getDateISO(new Date())}`;
}

export function getRandomMotivationCardId(): number {
  return Math.floor(Math.random() * 78);
}
