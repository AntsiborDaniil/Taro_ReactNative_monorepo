import type { TSettings, TSound } from 'shared/types';
import { DeckStyle } from '../api';

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
