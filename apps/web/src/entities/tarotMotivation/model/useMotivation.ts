import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import {
  MotivationKey,
  tarotCards,
  THabitItem,
  TMoodItem,
  TMotivationItem,
  TSelectedTarotCard,
} from 'shared/api';
import { LoadingsContext } from 'shared/contexts/Loadings';
import { useData } from 'shared/DataProvider';
import {
  getTarotCardReadings,
  getValueForAsyncDeviceMemoryKey,
  saveAsyncDeviceMemoryKey,
} from 'shared/lib';
import {
  getMotivationAIRequestBody,
  getMotivationMemoryKey,
  getRandomMotivationCardId,
} from '../lib';
import { TSelectMotivationItemParameters } from './types';

export type TTarotMotivationHookResult = {
  selectedMotivation: TMotivationItem | null;
  handleSelectMotivationItem: (
    params: TSelectMotivationItemParameters
  ) => Promise<void>;
};

export function useMotivation(): TTarotMotivationHookResult {
  const [selectedMotivation, setSelectedMotivation] =
    useState<TMotivationItem | null>(null);

  const { t, i18n } = useTranslation();

  const { setIsFullScreenLoading } = useData({ Context: LoadingsContext });

  const getAIMotivation = async ({
    key,
    card,
    params,
  }: {
    key: MotivationKey;
    card: TSelectedTarotCard;
    params?: TMoodItem | THabitItem;
  }): Promise<string> => {
    try {
      setIsFullScreenLoading?.(true);

      const aIRequestBody = getMotivationAIRequestBody({
        key,
        t,
        card,
        language: i18n.language,
        params,
      });

      const aiInterpretationResponse = await fetch(
        `https://tarot-api.ru/api/motivation/${key}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(aIRequestBody),
        }
      );

      const interpretation: string = (await aiInterpretationResponse.json())
        .interpretation;

      return interpretation;
    } finally {
      setIsFullScreenLoading?.(false);
    }
  };

  const handleSelectMotivationItem = async ({
    key,
    parameters,
  }: TSelectMotivationItemParameters) => {
    const savedMotivationItem =
      await getValueForAsyncDeviceMemoryKey<TMotivationItem>(
        getMotivationMemoryKey({ key })
      );

    if (savedMotivationItem) {
      setSelectedMotivation(savedMotivationItem);

      return;
    }

    const randomCard = tarotCards[getRandomMotivationCardId()];

    const selectedCard = getTarotCardReadings({
      card: randomCard,
      keys: ['description'],
    });

    const interpretation = await getAIMotivation({
      key,
      card: selectedCard,
      params: parameters,
    });

    const date: string = new Date().toISOString();
    const uid: string = uuidv4();

    const newMotivation: TMotivationItem = {
      interpretation,
      cards: [selectedCard],
      key,
      date,
      uid,
    };

    setSelectedMotivation(newMotivation);

    await saveAsyncDeviceMemoryKey(
      getMotivationMemoryKey({ key }),
      newMotivation
    );
  };

  return {
    selectedMotivation,
    handleSelectMotivationItem,
  };
}
