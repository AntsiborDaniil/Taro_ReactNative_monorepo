import { useMemo, useState } from 'react';
import AppMetrica from '@appmetrica/react-native-analytics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Clipboard from '@react-native-clipboard/clipboard';
import { useTranslation } from 'react-i18next';
import type { LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import {
  SpreadName,
  SpreadsCategory,
  TarotCardDirection,
  tarotCards,
  TSpread,
  TTarotCard,
} from 'shared/api';
import { LoadingsContext } from 'shared/contexts/Loadings';
import { useData } from 'shared/DataProvider';
import {
  DIRECTIONS,
  getRandomElementFromArray,
  getTarotCardReadings,
  getTodayISO,
  isTablet,
} from 'shared/lib';
import {
  AsyncMemoryKey,
  getValueForAsyncDeviceMemoryKey,
  saveAsyncDeviceMemoryKey,
} from 'shared/lib/deviceMemory';
import { AnalyticAction } from 'shared/types';
import { UserContext } from '../../user';
import {
  getAIRequestBody,
  getRandomCardId,
  getSpreadsCategoriesAndTabs,
  saveSpread,
  TSpreadSection,
  TSpreadTab,
} from '../lib';

type TErrors = {
  question?: boolean;
};

type TSpreadHookParameters = {
  hasReversedCards?: boolean;
};

export type TSpreadHookResult = {
  spread: TSpread | null;
  question: string;
  interpretationLoading: boolean;
  errors: TErrors;
  preSelectedTarotCard: TTarotCard | null;
  isSpreadCompleted: boolean;
  selectedCardsIds: Record<string, boolean>;
  spreadsDictionary: Partial<Record<SpreadsCategory, TSpread[]>>;
  spreadsTabs: TSpreadTab[];
  spreadsSections: TSpreadSection[];
  selectSpread: (value: TSpread) => Promise<{
    shouldRedirectToSpreadReading: boolean;
  }>;
  setQuestion: (value: string) => void;
  checkErrors: () => TErrors;
  selectFullSpread: (value: TSpread) => void;
  handleGetAIInterpretation: () => Promise<void>;
  handleLayoutCard: (index: number) => (event: LayoutChangeEvent) => void;
  handlePreSelectTarotCard: () => TTarotCard;
  handleSelectTarotCard: (card?: TTarotCard) => void;
  handleClearSelectedCards: () => void;
  handleCopySpreadInterpretation: () => void;
};

const appLink = {
  ios: 'https://apps.apple.com/app/id6749576474',
  android:
    'https://play.google.com/store/apps/details?id=com.melexp.tarotmobile',
};

export function useSpread({
  hasReversedCards,
}: TSpreadHookParameters): TSpreadHookResult {
  const [interpretationLoading, setInterpretationLoading] =
    useState<boolean>(false);
  const [question, setQuestion] = useState<string>('');
  const [spread, setSpread] = useState<TSpread | null>(null);
  const [preSelectedTarotCard, setPreSelectedTarotCard] =
    useState<TTarotCard | null>(null);
  const [selectedCardsIds, setSelectedCardsIds] = useState<
    Record<string, boolean>
  >({});
  const [errors, setErrors] = useState<TErrors>({});

  const { setIsFullScreenLoading } = useData({ Context: LoadingsContext });

  const { isPractitioner } = useData({ Context: UserContext });

  const { t, i18n } = useTranslation();

  const insets = useSafeAreaInsets();

  const checkErrors = (): TErrors => {
    const newErrors: TErrors = {};

    if (spread?.id !== SpreadName.Simple_DaySuggest) {
      newErrors.question = !question.length;
    }

    setErrors(newErrors);

    return newErrors;
  };

  const selectSpread = async (
    value: TSpread
  ): Promise<{ shouldRedirectToSpreadReading: boolean }> => {
    setSelectedCardsIds({});
    setSpread(value);
    setErrors({});
    setQuestion('');

    if (value.id === SpreadName.Simple_DaySuggest) {
      const daysSuggests = await getValueForAsyncDeviceMemoryKey<
        Record<string, TSpread>
      >(AsyncMemoryKey.SelectedCardsOfTheDay);

      const prevSelectedDaySuggest = daysSuggests?.[getTodayISO()];

      if (prevSelectedDaySuggest) {
        setSpread?.(prevSelectedDaySuggest);

        return { shouldRedirectToSpreadReading: true };
      }
    }

    return { shouldRedirectToSpreadReading: false };
  };

  const selectFullSpread = (selectedSpread: TSpread) => {
    setSpread(selectedSpread);
  };

  const handleLayoutCard = (index: number) => (event: LayoutChangeEvent) => {
    event.target.measure((x, y, width, height, pageX, pageY) => {
      setSpread((prevState) => {
        if (!prevState) {
          return prevState;
        }

        const cardsPosition = [...(prevState.cardsPosition ?? [])];

        cardsPosition[index] = {
          x: pageX,
          y: isTablet ? pageY + insets.top + insets.bottom : pageY,
        };

        return {
          ...prevState,
          cardsPosition,
        };
      });
    });
  };

  const handlePreSelectTarotCard = () => {
    const selectedDirection = hasReversedCards
      ? getRandomElementFromArray(DIRECTIONS)
      : TarotCardDirection.Upright;

    const preSelectedTarotCard = {
      ...tarotCards[getRandomCardId(selectedCardsIds)],
      direction: selectedDirection,
    };

    setPreSelectedTarotCard(preSelectedTarotCard);

    return preSelectedTarotCard;
  };

  // если не передаем, то выберется случайная карта
  const handleSelectTarotCard = async (card?: TTarotCard) => {
    const selectedCard = card ?? tarotCards[getRandomCardId(selectedCardsIds)];

    if (!selectedCard.direction) {
      selectedCard.direction = hasReversedCards
        ? getRandomElementFromArray(DIRECTIONS)
        : TarotCardDirection.Upright;
    }

    setSelectedCardsIds((prevState) => ({
      ...prevState,
      [selectedCard.id]: true,
    }));

    setPreSelectedTarotCard(null);

    if (!spread) {
      return;
    }

    if (spread.selectedCards.length >= spread.cardsCount) {
      return;
    }

    const newCard = getTarotCardReadings({
      card: selectedCard,
      direction: selectedCard.direction,
      spreadId: spread.id,
      index: spread.selectedCards.length,
    });

    const newSelectedCards = [...spread.selectedCards, newCard];

    const newSpread = { ...spread, selectedCards: newSelectedCards, question };

    setSpread(newSpread);

    const freeUseOfAI = await AsyncStorage.getItem(AsyncMemoryKey.FreeUseOfAI);

    if (newSelectedCards.length === spread.cardsCount) {
      if (
        spread?.id === SpreadName.Simple_DaySuggest ||
        (!isPractitioner && freeUseOfAI)
      ) {
        const savedSpread = await saveSpread(newSpread);

        if (savedSpread) {
          setSpread(savedSpread);
        }
      }
      setQuestion('');

      if (spread?.id === SpreadName.Simple_DaySuggest) {
        const daysSuggests = await getValueForAsyncDeviceMemoryKey<
          Record<string, TSpread>
        >(AsyncMemoryKey.SelectedCardsOfTheDay);

        await saveAsyncDeviceMemoryKey<Record<string, TSpread>>(
          AsyncMemoryKey.SelectedCardsOfTheDay,
          {
            ...(daysSuggests || {}),
            [getTodayISO()]: newSpread,
          }
        );
      }
    }
  };

  const handleClearSelectedCards = () => {
    setSpread((prevState) => {
      if (!prevState) {
        return prevState;
      }

      return { ...prevState, selectedCards: [] };
    });
    setSelectedCardsIds({});
  };

  const isSpreadCompleted = useMemo(
    () => spread?.selectedCards?.length === spread?.cardsCount,
    [spread?.cardsCount, spread?.selectedCards?.length]
  );

  const spreadsCategoriesAndTabs = useMemo(
    () => getSpreadsCategoriesAndTabs(),
    []
  );

  const handleCopySpreadInterpretation = () => {
    if (!spread?.interpretation) {
      return;
    }

    Clipboard.setString(
      `${t('spread:summaryTitle')} - ${t(spread.name)}\n\n${spread.interpretation}\n\n${t('core:downloadAppStore')}: ${appLink.ios}\n${t('core:downloadGooglePlay')}: ${appLink.android}`
    );

    Toast.show({
      type: 'success',
      text1: t('core:ai.copy.success'),
    });
  };

  const handleGetAIInterpretation = async (): Promise<void> => {
    const freeUseOfAI = await AsyncStorage.getItem(AsyncMemoryKey.FreeUseOfAI);

    if (
      (!isPractitioner && freeUseOfAI) ||
      spread?.id === SpreadName.Simple_DaySuggest ||
      spread?.interpretation
    ) {
      return;
    }

    const AIRequestBody = getAIRequestBody({
      t,
      spread,
      language: i18n.language,
    });

    try {
      setIsFullScreenLoading?.(true);
      setInterpretationLoading(true);

      const aiInterpretationResponse = await fetch(
        'https://tarot-api.ru/api/interpret',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(AIRequestBody),
        }
      );

      const interpretation: string = (await aiInterpretationResponse.json())
        .interpretation;

      setSpread((prevState) =>
        prevState ? { ...prevState, interpretation } : prevState
      );

      if (spread) {
        const savedSpread = await saveSpread({ ...spread, interpretation });

        if (savedSpread) {
          setSpread(savedSpread);
        }
      }

      AppMetrica.reportEvent(AnalyticAction.GetAIGeneration, {
        free: !!freeUseOfAI,
      });

      if (!isPractitioner && !freeUseOfAI) {
        await AsyncStorage.setItem(AsyncMemoryKey.FreeUseOfAI, '1');
      }
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: t('core:ai.error1'),
        text2: t('core:ai.error2'),
      });

      AppMetrica.reportError('AI interpretation Error', e.message);
    } finally {
      setIsFullScreenLoading?.(false);
      setInterpretationLoading(false);
    }
  };

  return {
    question,
    interpretationLoading,
    selectedCardsIds,
    spread,
    errors,
    isSpreadCompleted,
    preSelectedTarotCard,
    ...spreadsCategoriesAndTabs,
    selectSpread,
    setQuestion,
    checkErrors,
    selectFullSpread,
    handleLayoutCard,
    handleGetAIInterpretation,
    handleSelectTarotCard,
    handleClearSelectedCards,
    handlePreSelectTarotCard,
    handleCopySpreadInterpretation,
  };
}
