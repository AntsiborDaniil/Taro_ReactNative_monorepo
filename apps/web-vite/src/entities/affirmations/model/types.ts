/** Перенесено из apps/web/src/entities/affirmations/model/types.ts (без TGradientPallet — градиенты вне задачи). */
export enum AffirmationCategory {
  General = 'general',
  Career = 'career',
  Love = 'love',
  Purpose = 'purpose',
  Health = 'health',
  Motivation = 'motivation',
}

export type TAffirmationTextPart = { content: string; colored: boolean };
export type TAffirmationTexts = { id: number; text: TAffirmationTextPart[] };
export type TSelectedAffirmation = { texts: TAffirmationTexts };
export type TSavedAffirmations = Record<string, Partial<Record<AffirmationCategory, TSelectedAffirmation>>>;
