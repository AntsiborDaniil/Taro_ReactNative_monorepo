import { MotivationKey, THabitItem, TMoodItem } from 'shared/api';

export type TSelectMotivationItemParameters =
  | {
      key: MotivationKey.MoodAndEnergy;
      parameters: TMoodItem;
    }
  | {
      key: MotivationKey.Habits;
      parameters?: THabitItem;
    };
