/**
 * «Для влюблённых» (together_couple): проходит на одном устройстве через /api/interpret,
 * стоит ⚡2 (как глубокий разбор), с именами пары — свой промпт (spreadInterpretationService).
 */
export const COUPLE_SPREAD_KEY = 'together_couple';
export const COUPLE_NAME_MAX = 24;

export type CoupleNames = { him: string; her: string };

export function isCoupleSpread(spreadKey?: string): boolean {
  return spreadKey === COUPLE_SPREAD_KEY;
}

/** Имена без переносов и управляющих символов (идут в промпт). */
export function cleanName(value: unknown): string {
  return String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, COUPLE_NAME_MAX);
}
