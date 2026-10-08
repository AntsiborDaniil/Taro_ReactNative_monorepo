import { useEffect, useRef, useState, type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  addSelectedCard,
  addSelectedCards,
  buildInterpretContext,
  getAIRequestBody,
  freePeriodKindOf,
  saveFreePeriodCard,
  spreadFromSavedFreeCard,
  openSavedSpread,
  setError,
  setInterpretationResult,
  setStatus,
  useInterpretSpreadMutation,
  type InterpretErrorBody,
} from '@entities/spread';
import { loadHabits } from '@entities/habits';
import { loadMood } from '@entities/mood';
import { SpreadName, type TSelectedTarotCard } from '@legacy-data';
import { ensureI18nNamespaces } from '@shared/i18n';
import { haptic } from '@shared/lib/haptics';
import { AnalyticAction, track } from '@shared/lib/analytics';
import { MetrikaGoal, reachMetrikaGoal } from '@shared/lib/metrika';
import { isRtkNetworkError, rtkErrorStatus } from '@shared/lib/rtkQueryError';
import { useAppDispatch, useAppSelector } from '@shared/lib/store';
import { isWebAuthPending, shouldPromptWebSignIn } from '@shared/lib/webAuthGate';
import { maybeOfferAddToHomeScreen } from '@features/telegramHomeScreen';
import { AILoader, Button, ChargeMark, Header, Text, openModal, useToast } from '@shared/ui';
import { CardChoice } from './ui/CardChoice';
import styles from './Reading.module.css';

/**
 * Выбор карт расклада. «Читать объяснение» сначала дергает /api/interpret;
 * на /reading/result уходим только при успехе. Без зарядов / сеть / 429 —
 * модалка на этом экране, страница результата не открывается.
 */
export default function ReadingPage(): ReactElement {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const selectedSpread = useAppSelector((state) => state.spread.selectedSpread);
  const isAuthenticated = useAppSelector((state) => state.user.isAuthenticated);
  const sessionLoading = useAppSelector((state) => state.user.sessionLoading);
  const tarotDaily = useAppSelector((state) => state.user.tarotDaily);
  const spreadCredits = useAppSelector((state) => state.user.spreadCredits ?? 0);
  const allMoods = useAppSelector((state) => state.mood.allMoods);
  const habits = useAppSelector((state) => state.habits.habits);
  const [interpretSpread, { isLoading: isInterpreting }] = useInterpretSpreadMutation();
  const [isStarting, setIsStarting] = useState(false);

  const hasInterpretation = Boolean(selectedSpread?.interpretation?.trim());
  const drawnCount = selectedSpread?.selectedCards?.length ?? 0;
  const hasAllCards = drawnCount > 0 && drawnCount >= (selectedSpread?.cardsCount ?? 0);

  useEffect(() => {
    if (!selectedSpread) {
      navigate('/spreads', { replace: true });
    } else if (hasInterpretation && hasAllCards) {
      // История / уже готовое толкование — сразу результат.
      navigate('/reading/result', { replace: true });
    }
  }, [selectedSpread, hasInterpretation, hasAllCards, navigate]);

  const prefetched = useRef(false);
  useEffect(() => {
    if (drawnCount === 0 || prefetched.current) return;
    prefetched.current = true;
    void import('@pages/readingResult');
    void ensureI18nNamespaces('card');
  }, [drawnCount]);

  // Настроение и привычки нужны для контекста «памяти» (необязательны).
  useEffect(() => {
    dispatch(loadMood());
    dispatch(loadHabits());
  }, [dispatch]);

  /** Карты дня/недели/месяца бесплатны: без гейта по лимиту/зарядам и без ⚡. */
  const freeKind = freePeriodKindOf(selectedSpread?.id);
  const isDayCard = freeKind !== null;
  const cardsTotal = selectedSpread?.cardsCount ?? 0;
  /** «Глубокий разбор» — только обычные расклады с 3+ картами (не «Утро, день, вечер»). */
  const canDeep = !isDayCard && cardsTotal >= 3 && selectedSpread?.id !== SpreadName.Simple_DayParts;

  const remainingCredits =
    (tarotDaily != null ? Math.max(0, tarotDaily.limit - tarotDaily.used) : 0) +
    Math.max(0, spreadCredits);

  const handleReadExplanation = async (mode?: 'deep') => {
    if (!selectedSpread || isStarting || isInterpreting) return;
    if (isWebAuthPending(sessionLoading)) return;

    if (shouldPromptWebSignIn(isAuthenticated, sessionLoading)) {
      toast.info(t('core:ai.errorProvider'));
      return;
    }

    // Пока квота с /me не пришла — не уходим в результат и не открываем ложный лимит.
    // Карта дня бесплатна — квоту не проверяем вовсе.
    if (!isDayCard) {
      if (tarotDaily == null) return;

      if (remainingCredits < (mode === 'deep' ? 2 : 1)) {
        haptic.notify('warning');
        dispatch(openModal({ id: 'daily-limit' }));
        return;
      }
    }

    await ensureI18nNamespaces('card');
    const body = getAIRequestBody({
      spread: selectedSpread,
      t,
      language: i18n.language,
      mode,
      context: buildInterpretContext(allMoods, habits),
    });
    if (!body) {
      toast.error(t('core:ai.error1'));
      return;
    }

    setIsStarting(true);
    dispatch(setStatus('interpreting'));
    track(AnalyticAction.ClickCompleteSpread, { spread: selectedSpread.name });
    reachMetrikaGoal(MetrikaGoal.spreadCompleted, { spreadId: selectedSpread.id });

    try {
      const result = await interpretSpread(body).unwrap();
      dispatch(
        setInterpretationResult({
          interpretation: result.interpretation,
          memoryNote: result.memoryNote,
          memoryStats: result.memoryStats,
          mode,
        }),
      );
      haptic.success();
      if (freeKind) {
        saveFreePeriodCard(freeKind, {
          ...selectedSpread,
          interpretation: result.interpretation,
          memoryNote: result.memoryNote ?? undefined,
        });
      }
      track(AnalyticAction.GetAIGeneration, { free: false });
      reachMetrikaGoal(MetrikaGoal.aiGeneration, { spreadId: selectedSpread.id });
      void maybeOfferAddToHomeScreen(() => dispatch(openModal({ id: 'add-to-home-screen' })));
      // replace: «назад» с результата ведёт туда, откуда начали, а не обратно в карусель.
      navigate('/reading/result', { replace: true });
    } catch (err) {
      const status = rtkErrorStatus(err);
      const rtkError = err as { data?: InterpretErrorBody };
      if (status === 401) {
        haptic.notify('warning');
        toast.info(t('core:ai.errorProvider'));
        dispatch(setError('auth_required'));
        return;
      }
      // Карта периода уже открыта (другая вкладка/устройство) — показываем сохранённую.
      if (status === 409 && rtkError.data?.code === 'period_card_used') {
        const saved = (rtkError.data as { saved?: Parameters<typeof spreadFromSavedFreeCard>[1] | null }).saved;
        const restored = saved ? spreadFromSavedFreeCard(selectedSpread, saved) : null;
        haptic.notify('warning');
        toast.info(t('spread:freeCard.used'));
        if (restored && freeKind) {
          saveFreePeriodCard(freeKind, restored);
          dispatch(openSavedSpread(restored));
          navigate('/reading/result', { replace: true });
        } else {
          dispatch(setError('period_card_used'));
        }
        return;
      }
      if (status === 429) {
        haptic.notify('warning');
        dispatch(openModal({ id: 'daily-limit' }));
        dispatch(setError('daily_limit'));
        return;
      }
      if (isRtkNetworkError(err)) {
        haptic.notify('warning');
        dispatch(openModal({ id: 'network-error' }));
        dispatch(setError('network'));
        return;
      }
      haptic.notify('warning');
      toast.error(t('core:ai.error1'));
      dispatch(setError(rtkError.data?.code ?? 'failed'));
    } finally {
      setIsStarting(false);
    }
  };

  if (!selectedSpread) {
    return (
      <div className={styles.page}>
        <div className={styles.column}>
          <Header title="" showBack />
        </div>
      </div>
    );
  }

  const selectedCards = selectedSpread.selectedCards ?? [];
  const isComplete = selectedSpread.cardsCount > 0 && hasAllCards;
  const busy = isStarting || isInterpreting;

  return (
    <div className={styles.page}>
      <div className={styles.column}>
        <Header title={t(selectedSpread.name)} showBack />

        {selectedSpread.question ? (
          <div className={styles.question}>
            <Text role="label" tone="accent">
              {t('spread:flow.questionSection')}
            </Text>
            <Text role="lead" tone="ink50">
              {selectedSpread.question}
            </Text>
          </div>
        ) : null}

        <CardChoice
          spread={selectedSpread}
          selectedCards={selectedCards}
          onDraw={(card: TSelectedTarotCard) => dispatch(addSelectedCard(card))}
          onDrawAll={(cards: TSelectedTarotCard[]) => dispatch(addSelectedCards(cards))}
        />

        {isComplete ? (
          <div className={styles.completion}>
            <Button
              variant="action"
              fullWidth
              disabled={busy}
              icon={isDayCard ? undefined : <ChargeMark size="md" onAction />}
              iconPosition="end"
              onClick={() => {
                void handleReadExplanation();
              }}
            >
              {t('core:choice.completed')}
            </Button>
            {canDeep ? (
              <Button
                variant="quiet"
                fullWidth
                disabled={busy}
                icon={<ChargeMark cost={2} size="md" />}
                iconPosition="end"
                onClick={() => {
                  void handleReadExplanation('deep');
                }}
              >
                {t('spread:deep.cta')}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
      {busy ? <AILoader /> : null}
    </div>
  );
}
