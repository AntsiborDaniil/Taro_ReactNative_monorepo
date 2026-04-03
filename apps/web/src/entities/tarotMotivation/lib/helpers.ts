import type { TFunction } from 'i18next';
import {
  MotivationKey,
  THabitItem,
  TMoodItem,
  TSelectedTarotCard,
} from 'shared/api';
import { getTodayISO } from 'shared/lib';

export function getMotivationMemoryKey({
  key,
}: {
  key: MotivationKey;
}): string {
  return `MotivationMemoryKey_${key}_${getTodayISO()}`;
}

export function getRandomMotivationCardId(): number {
  return Math.floor(Math.random() * 78);
}

type TMoodAndEnergyInput = {
  params: TMoodItem;
  card: { card: string; direction: string };
  language: string;
};

type THabitsInput = {
  params: THabitItem;
  card: { card: string; direction: string };
  language: string;
};

type TMotivationAIRequestBody = TMoodAndEnergyInput | THabitsInput;

export function getMoodAndEnergyAIRequestBody({
  card,
  t,
  language,
  params,
}: {
  card: TSelectedTarotCard;
  params: TMoodItem;
  t: TFunction<'translation', undefined>;
  language: string;
}): TMoodAndEnergyInput | null {
  if (!card) {
    return null;
  }

  return {
    language,
    card: { card: t(card.name), direction: card.direction ?? 'upright' },
    params,
  };
}

export function getHabitsAIRequestBody({
  card,
  t,
  language,
  params,
}: {
  card: TSelectedTarotCard;
  params?: THabitItem;
  t: TFunction<'translation', undefined>;
  language: string;
}): THabitsInput | null {
  if (!card) {
    return null;
  }

  return {
    language,
    card: { card: t(card.name), direction: card.direction ?? 'upright' },
    params,
  };
}

export function getMotivationAIRequestBody({
  key,
  card,
  t,
  language,
  params,
}: {
  key: MotivationKey;
  card: TSelectedTarotCard;
  params?: TMoodItem | THabitItem;
  t: TFunction<'translation', undefined>;
  language: string;
}): TMotivationAIRequestBody | null {
  switch (key) {
    case MotivationKey.MoodAndEnergy:
      return getMoodAndEnergyAIRequestBody({
        card,
        t,
        language,
        params: params as TMoodItem,
      });
    case MotivationKey.Habits:
      return getHabitsAIRequestBody({
        card,
        t,
        language,
        params: params as THabitItem,
      });
    default:
      return null;
  }
}
