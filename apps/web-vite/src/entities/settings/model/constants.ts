import { DeckStyle, type TSettings, type TSound } from './types';

/** Перенос apps/web/src/shared/constants/settings.constants.ts 1-в-1. */
export const SOUND_SETTINGS: TSound = {
  vibration: true,
  notifications: true,
  moonNotifications: true,
};

export const DEFAULT_SETTINGS: TSettings = {
  sound: SOUND_SETTINGS,
  appearance: {
    deckStyle: DeckStyle.FlatIllustration,
  },
  spread: {
    hasReversed: true,
  },
};
