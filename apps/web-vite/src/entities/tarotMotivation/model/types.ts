/**
 * Перенесено из apps/web/src/shared/api/motivation/motivation.ts (чистый тип,
 * без RN). MotivationKey — ключ сценария мотивационной карты: после оценки
 * настроения (MoodAndEnergy) или после закрытия недельных целей (Habits).
 */
export enum MotivationKey {
  Habits = 'habits',
  MoodAndEnergy = 'moodAndEnergy',
}

export type TMotivationCard = {
  id: string;
  name: string;
  direction: string;
};

export type TMotivationItem = {
  cards: TMotivationCard[];
  key: MotivationKey;
  interpretation: string;
  date: string;
  uid: string;
};
