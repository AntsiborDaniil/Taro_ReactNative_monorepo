import { SpreadName } from 'shared/api';

/**
 * Previously Yes/No + Day card were free without auth.
 * All spreads now use the same daily / credits quota.
 */
export function isGuestFreeSpreadId(
  _id: SpreadName | string | undefined
): boolean {
  return false;
}
