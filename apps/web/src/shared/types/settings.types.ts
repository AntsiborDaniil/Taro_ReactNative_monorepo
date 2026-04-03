import { DeckStyle } from '../api';

export enum SoundField {
  Vibration = 'vibration',
  Notifications = 'notifications',
  MoonNotifications = 'moonNotifications',
}

export type TSound = {
  vibration: boolean;
  notifications: boolean;
  moonNotifications: boolean;
};

export type TAppearance = {
  deckStyle?: DeckStyle;
};

export type TSpreadSettings = {
  hasReversed?: boolean;
};

export type TSettings = {
  sound?: TSound;
  appearance?: TAppearance;
  spread?: TSpreadSettings;
};

export type TSoundFields = {
  name: string;
  value: SoundField;
};
