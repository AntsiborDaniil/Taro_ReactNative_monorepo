import { createElement, useEffect, useMemo, useState } from 'react';
import AppMetrica from '@appmetrica/react-native-analytics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Clipboard from '@react-native-clipboard/clipboard';
import { useTranslation } from 'react-i18next';
import type { LayoutChangeEvent } from 'react-native';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { SignInForSpreadsModal, DailyTarotLimitModal } from 'features/tarotAccess/ui';
import {
  SpreadName,
  SpreadsCategory,
  TarotCardDirection,
  tarotCards,
  authCredentials,
  authRequestHeaders,
  getTarotAiApiBaseUrl,
  TSpread,
  TTarotCard,
} from 'shared/api';
import { LoadingsContext } from 'shared/contexts/Loadings';
import { useData } from 'shared/DataProvider';
import {
  DIRECTIONS,
  getRandomElementFromArray,
  getTarotCardReadings,
  isGuestFreeSpreadId,
  isTablet,
  isWebAuthPending,
  MetrikaGoal,
  reachMetrikaGoal,
  shouldPromptWebSignIn,
} from 'shared/lib';
import { AsyncMemoryKey } from 'shared/lib/deviceMemory';
import { measurePageTopLeft } from 'shared/lib/measurePageCoordinates';
import { AnalyticAction } from 'shared/types';
import { ModalsContext } from 'shared/ui/ModalsProvider';
import { UserContext } from '../../user';
import {
  clearTodayDayCard,
  getTodayDayCard,
  saveTodayDayCard,
} from './dayCardStore';
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
  dayCardHydrated: boolean;
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
  handleGetAIInterpretation: () => Promise<boolean>;
  handleLayoutCard: (index: number) => (event: LayoutChangeEvent) => void;
  handlePreSelectTarotCard: () => TTarotCard;
  handleSelectTarotCard: (card?: TTarotCard) => Promise<boolean>;
  handleClearSelectedCards: () => void;
  handleResetDaySuggest: () => Promise<void>;
  handleCopySpreadInterpretation: () => void;
};

const DAY_CARD_DEBUG = '[DayCardFlow]';

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
  const [dayCardHydrated, setDayCardHydrated] = useState<boolean>(false);

  const { setIsFullScreenLoading } = useData({ Context: LoadingsContext });

  const { isPractitioner, isAuthenticated, authSessionLoading, tarotDaily, setTarotDaily } =
    useData({
      Context: UserContext,
    });

  const { showModal } = useData({ Context: ModalsContext });

  const { t, i18n } = useTranslation();

  const insets = useSafeAreaInsets();

  const getSelectedCardsIdsMap = (
    selectedCards: Array<{ id?: string }> = []
  ): Record<string, boolean> =>
    selectedCards.reduce<Record<string, boolean>>((acc, card) => {
      if (!card?.id) {
        return acc;
      }
      acc[card.id] = true;
      return acc;
    }, {});

  useEffect(() => {
    let isMounted = true;

    const hydrateDayCard = async () => {
      try {
        if (__DEV__) {
          console.log(`${DAY_CARD_DEBUG} hydrate:start`);
        }
        const hydratedDaySpread = await getTodayDayCard();

        if (__DEV__) {
          console.log(`${DAY_CARD_DEBUG} hydrate:result`, {
            hasSpread: !!hydratedDaySpread,
            spreadId: hydratedDaySpread?.id,
            selectedCardsLength: hydratedDaySpread?.selectedCards?.length ?? 0,
          });
        }

        if (!isMounted || !hydratedDaySpread) {
          return;
        }

        setSpread((prevState) => prevState ?? hydratedDaySpread);
        setSelectedCardsIds((prevState) =>
          Object.keys(prevState).length
            ? prevState
            : getSelectedCardsIdsMap(hydratedDaySpread.selectedCards)
        );
      } finally {
        if (isMounted) {
          setDayCardHydrated(true);
          if (__DEV__) {
            console.log(`${DAY_CARD_DEBUG} hydrate:done`);
          }
        }
      }
    };

    hydrateDayCard();

    return () => {
      isMounted = false;
    };
  }, []);

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
    if (__DEV__) {
      console.log(`${DAY_CARD_DEBUG} selectSpread:start`, {
        spreadId: value.id,
      });
    }
    setSelectedCardsIds({});
    setSpread(value);
    setErrors({});
    setQuestion('');

    if (value.id === SpreadName.Simple_DaySuggest) {
      const prevSelectedDaySuggest = await getTodayDayCard();
      if (__DEV__) {
        console.log(`${DAY_CARD_DEBUG} selectSpread:existingDayCard`, {
          hasCard: !!prevSelectedDaySuggest,
          selectedCardsLength: prevSelectedDaySuggest?.selectedCards?.length ?? 0,
        });
      }

      if (prevSelectedDaySuggest) {
        setSpread(prevSelectedDaySuggest);
        setSelectedCardsIds(
          getSelectedCardsIdsMap(prevSelectedDaySuggest.selectedCards)
        );

        return { shouldRedirectToSpreadReading: true };
      }
    }

    return { shouldRedirectToSpreadReading: false };
  };

  const selectFullSpread = (selectedSpread: TSpread) => {
    setSpread(selectedSpread);
  };

  const handleLayoutCard = (index: number) => (event: LayoutChangeEvent) => {
    const applyCardPosition = (pageX: number, pageY: number) => {
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
    };

    if (measurePageTopLeft(event, applyCardPosition)) {
      return;
    }

    const { x, y } = event.nativeEvent.layout;
    applyCardPosition(x, y);
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
  const handleSelectTarotCard = async (card?: TTarotCard): Promise<boolean> => {
    const selectedCard = card ?? tarotCards[getRandomCardId(selectedCardsIds)];
    if (__DEV__) {
      console.log(`${DAY_CARD_DEBUG} handleSelectTarotCard:start`, {
        incomingCardId: card?.id,
        selectedCardId: selectedCard?.id,
        spreadId: spread?.id,
        spreadSelectedCardsLength: spread?.selectedCards?.length ?? 0,
      });
    }

    if (!selectedCard.direction) {
      selectedCard.direction = hasReversedCards
        ? getRandomElementFromArray(DIRECTIONS)
        : TarotCardDirection.Upright;
    }

    if (!spread) {
      if (__DEV__) {
        console.warn(`${DAY_CARD_DEBUG} handleSelectTarotCard:abort:noSpread`);
      }
      return false;
    }

    if (spread.selectedCards.length >= spread.cardsCount) {
      if (__DEV__) {
        console.warn(`${DAY_CARD_DEBUG} handleSelectTarotCard:abort:alreadyCompleted`, {
          selectedCardsLength: spread.selectedCards.length,
          cardsCount: spread.cardsCount,
        });
      }
      return false;
    }

    if (
      Platform.OS === 'web' &&
      spread.selectedCards.length === 0 &&
      spread.id === SpreadName.Simple_DaySuggest
    ) {
      reachMetrikaGoal(MetrikaGoal.spreadStarted, { spreadId: spread.id });
    }

    const freeUseOfAI = await AsyncStorage.getItem(AsyncMemoryKey.FreeUseOfAI);
    const nextCount = spread.selectedCards.length + 1;
    const willComplete = nextCount === spread.cardsCount;
    const needsSlot =
      spread?.id === SpreadName.Simple_DaySuggest ||
      (!isPractitioner && freeUseOfAI);

    if (
      Platform.OS === 'web' &&
      willComplete &&
      needsSlot &&
      !isGuestFreeSpreadId(spread.id)
    ) {
      if (shouldPromptWebSignIn(isAuthenticated, authSessionLoading)) {
        showModal?.(createElement(SignInForSpreadsModal));
        return false;
      }
    }

    setSelectedCardsIds((prevState) => ({
      ...prevState,
      [selectedCard.id]: true,
    }));

    setPreSelectedTarotCard(null);

    const newCard = getTarotCardReadings({
      card: selectedCard,
      direction: selectedCard.direction,
      spreadId: spread.id,
      index: spread.selectedCards.length,
    });

    const newSelectedCards = [...spread.selectedCards, newCard];

    const newSpread = { ...spread, selectedCards: newSelectedCards, question };

    setSpread(newSpread);
    if (__DEV__) {
      console.log(`${DAY_CARD_DEBUG} handleSelectTarotCard:spreadUpdated`, {
        spreadId: newSpread.id,
        selectedCardsLength: newSelectedCards.length,
      });
    }

    if (newSelectedCards.length === spread.cardsCount) {
      let completedSpread = newSpread;

      if (
        spread?.id === SpreadName.Simple_DaySuggest ||
        (!isPractitioner && freeUseOfAI)
      ) {
        const savedSpread = await saveSpread(newSpread);

        if (savedSpread) {
          const normalized = {
            ...savedSpread,
            question: savedSpread.question ?? '',
          };
          setSpread(normalized);
          completedSpread = normalized;
        }
      }
      setQuestion('');

      if (spread?.id === SpreadName.Simple_DaySuggest) {
        await saveTodayDayCard(completedSpread);
        if (__DEV__) {
          console.log(`${DAY_CARD_DEBUG} handleSelectTarotCard:dayCardSaved`, {
            selectedCardsLength: completedSpread.selectedCards?.length ?? 0,
          });
        }
      }
    }
    if (__DEV__) {
      console.log(`${DAY_CARD_DEBUG} handleSelectTarotCard:success`);
    }
    return true;
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

  const handleResetDaySuggest = async () => {
    await clearTodayDayCard();

    setSelectedCardsIds({});
    setPreSelectedTarotCard(null);
    setQuestion('');
    setErrors({});
    setSpread((prevState) => {
      if (!prevState || prevState.id !== SpreadName.Simple_DaySuggest) {
        return prevState;
      }

      return {
        ...prevState,
        selectedCards: [],
        interpretation: '',
      };
    });
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

  const applyOfflineGuestInterpretation = async (
    currentSpread: TSpread
  ): Promise<boolean> => {
    const localText =
      currentSpread.id === SpreadName.Simple_DaySuggest
        ? t('spread:daySuggest.guestInterpretation')
        : t('spread:yesNo.guestInterpretation');

    setSpread((prevState) =>
      prevState ? { ...prevState, interpretation: localText } : prevState
    );
    const savedSpread = await saveSpread({
      ...currentSpread,
      interpretation: localText,
    });
    if (savedSpread) {
      setSpread({
        ...savedSpread,
        question: savedSpread.question ?? currentSpread.question ?? '',
      });
    }
    return true;
  };

  const showInterpretError = (code?: string) => {
    if (code === 'ai_provider_unavailable') {
      Toast.show({
        type: 'error',
        text1: t('core:ai.errorProvider'),
        text2: t('core:ai.error2'),
      });
      return;
    }

    Toast.show({
      type: 'error',
      text1: t('core:ai.error1'),
      text2: t('core:ai.error2'),
    });
  };

  const handleGetAIInterpretation = async (): Promise<boolean> => {
    const freeUseOfAI = await AsyncStorage.getItem(AsyncMemoryKey.FreeUseOfAI);

    if (spread?.interpretation) {
      return true;
    }

    if (isWebAuthPending(authSessionLoading)) {
      return false;
    }

    const guestFree = isGuestFreeSpreadId(spread?.id);
    const webGuest = shouldPromptWebSignIn(isAuthenticated, authSessionLoading);

    if (webGuest && guestFree && spread) {
      return applyOfflineGuestInterpretation(spread);
    }

    if (
      !isPractitioner &&
      freeUseOfAI &&
      (Platform.OS !== 'web' || webGuest) &&
      !guestFree
    ) {
      if (webGuest) {
        showModal?.(createElement(SignInForSpreadsModal));
      }
      return false;
    }

    if (webGuest && !guestFree) {
      showModal?.(createElement(SignInForSpreadsModal));
      return false;
    }

    if (
      Platform.OS === 'web' &&
      tarotDaily != null &&
      tarotDaily.used >= tarotDaily.limit
    ) {
      showModal?.(createElement(DailyTarotLimitModal));
      return false;
    }

    const AIRequestBody = getAIRequestBody({
      t,
      spread,
      language: i18n.language,
    });

    if (!AIRequestBody) {
      return false;
    }

    try {
      setIsFullScreenLoading?.(true);
      setInterpretationLoading(true);

      const aiInterpretationResponse = await fetch(
        `${getTarotAiApiBaseUrl()}/api/interpret`,
        {
          method: 'POST',
          credentials: authCredentials(),
          headers: {
            'Content-Type': 'application/json',
            'X-Web-Cookie-Auth': '1',
            ...authRequestHeaders(null),
          },
          cache: 'no-store',
          body: JSON.stringify(AIRequestBody),
        }
      );

      if (!aiInterpretationResponse.ok) {
        let body: {
          code?: string;
          tarotDaily?: {
            used: number;
            limit: number;
            day: string;
          };
        } = {};
        try {
          body = (await aiInterpretationResponse.json()) as typeof body;
        } catch {
          // ignore non-JSON error body
        }

        if (aiInterpretationResponse.status === 401) {
          if (guestFree && spread) {
            return applyOfflineGuestInterpretation(spread);
          }
          showModal?.(createElement(SignInForSpreadsModal));
          return false;
        }

        if (
          aiInterpretationResponse.status === 429 &&
          (body.code === 'daily_limit_reached' || body.tarotDaily)
        ) {
          if (body.tarotDaily) {
            setTarotDaily?.(body.tarotDaily);
          }
          showModal?.(createElement(DailyTarotLimitModal));
          return false;
        }

        showInterpretError(body.code);
        return false;
      }

      const payload = (await aiInterpretationResponse.json()) as {
        interpretation: string;
        tarotDaily?: {
          used: number;
          limit: number;
          day: string;
        };
      };
      const interpretation = payload.interpretation;
      if (payload.tarotDaily) {
        setTarotDaily?.(payload.tarotDaily);
      }

      setSpread((prevState) =>
        prevState ? { ...prevState, interpretation } : prevState
      );

      if (spread) {
        const savedSpread = await saveSpread({ ...spread, interpretation });

        if (savedSpread) {
          setSpread({
            ...savedSpread,
            question: savedSpread.question ?? spread.question ?? '',
          });
        }
      }

      AppMetrica.reportEvent(AnalyticAction.GetAIGeneration, {
        free: !!freeUseOfAI,
      });
      reachMetrikaGoal(MetrikaGoal.aiGeneration, {
        spreadId: spread?.id,
      });

      if (!isPractitioner && !freeUseOfAI) {
        await AsyncStorage.setItem(AsyncMemoryKey.FreeUseOfAI, '1');
      }

      return true;
    } catch (e: any) {
      showInterpretError();
      AppMetrica.reportError('AI interpretation Error', e.message);
      return false;
    } finally {
      setIsFullScreenLoading?.(false);
      setInterpretationLoading(false);
    }
  };

  return {
    dayCardHydrated,
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
    handleResetDaySuggest,
    handlePreSelectTarotCard,
    handleCopySpreadInterpretation,
  };
}
