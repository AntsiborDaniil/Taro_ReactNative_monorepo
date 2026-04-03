import { TGradientPallet } from 'shared/themes';

export type TAffirmationTexts = {
  id: number;
  text: {
    content: string;
    colored: boolean;
  }[];
};

export type TSelectedAffirmation = {
  colors: TGradientPallet;
  texts: TAffirmationTexts;
};

export enum AffirmationCategory {
  General = 'general',
  Career = 'career',
  Love = 'love',
  Purpose = 'purpose',
  Health = 'health',
  Motivation = 'motivation',
}

export type TSavedAffirmations = Record<
  string,
  Partial<Record<AffirmationCategory, TSelectedAffirmation>>
>;
