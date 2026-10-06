import { useEffect, useRef, useState, type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  addSelectedCard,
  addSelectedCards,
  getAIRequestBody,
  setError,
  setInterpretation,
  setStatus,
  useInterpretSpreadMutation,
  type InterpretErrorBody,
} from '@entities/spread';
import type { TSelectedTarotCard } from '@legacy-data';
import { ensureI18nNamespaces } from '@shared/i18n';
import { AnalyticAction, track } from '@shared/lib/analytics';
import { MetrikaGoal, reachMetrikaGoal } from '@shared/lib/metrika';
import { isRtkNetworkError, rtkErrorStatus } from '@shared/lib/rtkQueryError';
import { useAppDispatch, useAppSelector } from '@shared/lib/store';
import { isWebAuthPending, shouldPromptWebSignIn } from '@shared/lib/webAuthGate';
import { maybeOfferAddToHomeScreen } from '@features/telegramHomeScreen';
import { AILoader, Button, Header, Text, openModal, useToast } from '@shared/ui';
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

  const remainingCredits =
    (tarotDaily != null ? Math.max(0, tarotDaily.limit - tarotDaily.used) : 0) +
    Math.max(0, spreadCredits);

  const handleReadExplanation = async () => {
    if (!selectedSpread || isStarting || isInterpreting) return;
    if (isWebAuthPending(sessionLoading)) return;

    if (shouldPromptWebSignIn(isAuthenticated, sessionLoading)) {
      toast.info(t('core:ai.errorProvider'));
      return;
    }

    // Пока квота с /me не пришла — не уходим в результат и не открываем ложный лимит.
    if (tarotDaily == null) return;

    if (remainingCredits <= 0) {
      dispatch(openModal({ id: 'daily-limit' }));
      return;
    }

    await ensureI18nNamespaces('card');
    const body = getAIRequestBody({
      spread: selectedSpread,
      t,
      language: i18n.language,
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
      dispatch(setInterpretation(result.interpretation));
      track(AnalyticAction.GetAIGeneration, { free: false });
      reachMetrikaGoal(MetrikaGoal.aiGeneration, { spreadId: selectedSpread.id });
      void maybeOfferAddToHomeScreen(() => dispatch(openModal({ id: 'add-to-home-screen' })));
      navigate('/reading/result');
    } catch (err) {
      const status = rtkErrorStatus(err);
      const rtkError = err as { data?: InterpretErrorBody };
      if (status === 401) {
        toast.info(t('core:ai.errorProvider'));
        dispatch(setError('auth_required'));
        return;
      }
      if (status === 429) {
        dispatch(openModal({ id: 'daily-limit' }));
        dispatch(setError('daily_limit'));
        return;
      }
      if (isRtkNetworkError(err)) {
        dispatch(openModal({ id: 'network-error' }));
        dispatch(setError('network'));
        return;
      }
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
              onClick={() => {
                void handleReadExplanation();
              }}
            >
              {t('core:choice.completed')}
            </Button>
          </div>
        ) : null}
      </div>
      {busy ? <AILoader /> : null}
    </div>
  );
}
