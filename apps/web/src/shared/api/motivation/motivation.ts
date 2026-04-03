import { TSelectedTarotCard } from '../spreadsAndCards';

export enum MotivationKey {
  Habits = 'habits',
  MoodAndEnergy = 'moodAndEnergy',
}

export type TMotivationItem = {
  cards: TSelectedTarotCard[];
  key: MotivationKey;
  // добавляются при сохранении карты в памяти
  interpretation?: string;
  date?: string;
  uid?: string;
};
