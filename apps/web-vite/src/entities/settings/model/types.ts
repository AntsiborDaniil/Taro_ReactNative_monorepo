/**
 * Перенос apps/web/src/shared/types/settings.types.ts + DeckStyle
 * (apps/web/src/shared/api/application/types.ts, не заведён отдельный алиас —
 * значения продублированы 1-в-1, это всего 3 строковых константы).
 */
export enum DeckStyle {
  FlatIllustration = 'flatIllustration',
  RiderWaiteOriginal = 'riderWaiteOriginal',
  ModernMysticalMinimalism = 'modernMysticalMinimalism',
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
