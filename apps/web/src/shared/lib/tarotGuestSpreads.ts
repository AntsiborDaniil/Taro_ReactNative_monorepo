import { SpreadName } from 'shared/api';

/** Расклады, доступные без входа (веб). */
export function isGuestFreeSpreadId(id: SpreadName | string | undefined): boolean {
  return id === SpreadName.Simple_YesNo || id === SpreadName.Simple_DaySuggest;
}
