export type TMoodItem = {
  mood: number | null;
  energy: number | null;
  stress: number | null;
};

export type THabitItem =
  | {
      goodHabits: string[];
      badHabits: string[];
    }
  | undefined;

export type TMemoryMoodItem = {
  date: string;
} & TMoodItem;

export enum MoodDisplayMode {
  Week = 'week',
  Month = 'month',
  Year = 'year',
}
