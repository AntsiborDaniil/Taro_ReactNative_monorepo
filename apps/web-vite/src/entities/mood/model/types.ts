/** Перенесено из apps/web/src/shared/api/moodAndEnergy/moodAndEnergy.ts (чистые типы). */
export type TMoodItem = {
  mood: number | null;
  energy: number | null;
  stress: number | null;
};

export type TMemoryMoodItem = { date: string } & TMoodItem;
