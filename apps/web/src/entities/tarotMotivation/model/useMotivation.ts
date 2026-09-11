import { createElement, useState } from 'react';
import { Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import { UserContext } from 'entities/user';
import {
  MotivationKey,
  tarotCards,
  THabitItem,
  TMoodItem,
  TMotivationItem,
  authCredentials,
  authRequestHeaders,
  getTarotAiApiBaseUrl,
  TSelectedTarotCard,
} from 'shared/api';
import { LoadingsContext } from 'shared/contexts/Loadings';
import { useData } from 'shared/DataProvider';
import {
  getTarotCardReadings,
  getValueForAsyncDeviceMemoryKey,
  saveAsyncDeviceMemoryKey,
} from 'shared/lib';
import { patchCachedAuthMeQuota } from 'shared/lib/web/fetchAuthMeSession';
import {
  DailyTarotLimitModal,
  SignInForSpreadsModal,
} from 'features/tarotAccess/ui';
import { ModalsContext } from 'shared/ui/ModalsProvider';
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
  ) => Promise<boolean>;
};

type QuotaPayload = {
  tarotDaily?: {
    used: number;
    limit: number;
    day: string;
  };
  spreadCredits?: number;
};

export function useMotivation(): TTarotMotivationHookResult {
  const [selectedMotivation, setSelectedMotivation] =
    useState<TMotivationItem | null>(null);

  const { t, i18n } = useTranslation();

  const { setIsFullScreenLoading } = useData({ Context: LoadingsContext });
  const { showModal } = useData({ Context: ModalsContext });
  const {
    tarotDaily,
    spreadCredits,
    setTarotDaily,
    setSpreadCredits,
    isPractitioner,
  } = useData({ Context: UserContext });

  const applyQuota = (payload: QuotaPayload) => {
    if (payload.tarotDaily) {
      setTarotDaily?.(payload.tarotDaily);
    }
    if (typeof payload.spreadCredits === 'number') {
      setSpreadCredits?.(payload.spreadCredits);
    }
    patchCachedAuthMeQuota({
      tarotDaily: payload.tarotDaily,
      spreadCredits: payload.spreadCredits,
    });
  };

  const getAIMotivation = async ({
    key,
    card,
    params,
  }: {
    key: MotivationKey;
    card: TSelectedTarotCard;
    params?: TMoodItem | THabitItem;
  }): Promise<string | null> => {
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
        `${getTarotAiApiBaseUrl()}/api/motivation/${key}`,
        {
          method: 'POST',
          credentials: authCredentials(),
          headers: {
            'Content-Type': 'application/json',
            'X-Web-Cookie-Auth': '1',
            ...authRequestHeaders(null),
          },
          cache: 'no-store',
          body: JSON.stringify(aIRequestBody),
        }
      );

      let body: QuotaPayload & {
        interpretation?: string;
        code?: string;
      } = {};
      try {
        body = (await aiInterpretationResponse.json()) as typeof body;
      } catch {
        // ignore non-JSON
      }

      if (!aiInterpretationResponse.ok) {
        if (aiInterpretationResponse.status === 401) {
          showModal?.(createElement(SignInForSpreadsModal, {
            i18nNamespace: 'moodAndEnergy',
          }));
          return null;
        }

        if (
          aiInterpretationResponse.status === 429 &&
          (body.code === 'daily_limit_reached' || body.tarotDaily)
        ) {
          applyQuota(body);
          showModal?.(createElement(DailyTarotLimitModal));
          return null;
        }

        return null;
      }

      if (key === MotivationKey.MoodAndEnergy) {
        applyQuota(body);
      }

      return body.interpretation?.trim() || null;
    } finally {
      setIsFullScreenLoading?.(false);
    }
  };

  const handleSelectMotivationItem = async ({
    key,
    parameters,
  }: TSelectMotivationItemParameters): Promise<boolean> => {
    const savedMotivationItem =
      await getValueForAsyncDeviceMemoryKey<TMotivationItem>(
        getMotivationMemoryKey({ key })
      );

    if (savedMotivationItem) {
      setSelectedMotivation(savedMotivationItem);
      return true;
    }

    if (
      key === MotivationKey.MoodAndEnergy &&
      Platform.OS === 'web' &&
      !isPractitioner &&
      tarotDaily != null &&
      tarotDaily.used >= tarotDaily.limit &&
      (spreadCredits ?? 0) <= 0
    ) {
      showModal?.(createElement(DailyTarotLimitModal));
      return false;
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

    if (!interpretation) {
      return false;
    }

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

    return true;
  };

  return {
    selectedMotivation,
    handleSelectMotivationItem,
  };
}
