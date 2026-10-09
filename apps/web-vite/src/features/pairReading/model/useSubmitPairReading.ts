import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { TSpread } from '@entities/spread';
import { ensureI18nNamespaces } from '@shared/i18n';
import { haptic } from '@shared/lib/haptics';
import { MetrikaGoal, reachMetrikaGoal } from '@shared/lib/metrika';
import { isRtkNetworkError, rtkErrorStatus } from '@shared/lib/rtkQueryError';
import { useAppDispatch } from '@shared/lib/store';
import { openModal, useToast } from '@shared/ui';
import { useCreatePairMutation, useSubmitPairCardsMutation } from '../api';
import { toPairCards } from '../lib/mapCards';
import { clearPairDraft, loadPairDraft } from './draft';
import type { PairErrorBody } from './types';

/**
 * Завершение выбора карт для «Расклада на двоих»:
 * - автор: POST /api/pairs (списание ⚡2, если бесплатная пара уже была) → /pair/:id;
 * - партнёр (?pair=<id>): POST /api/pairs/:id/cards → /pair/:id (там экран согласия).
 * Ошибки (нет зарядов, лимиты, сеть) разбирает сам хук — тосты/модалки.
 */
export function useSubmitPairReading(): {
  submitAuthor: (spread: TSpread) => Promise<void>;
  submitPartner: (spread: TSpread, pairId: string) => Promise<void>;
  busy: boolean;
} {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const [createPair, { isLoading: creating }] = useCreatePairMutation();
  const [submitCards, { isLoading: submitting }] = useSubmitPairCardsMutation();

  const handleError = useCallback(
    (err: unknown) => {
      const status = rtkErrorStatus(err);
      const data = (err as { data?: PairErrorBody }).data;
      haptic.notify('warning');
      if (isRtkNetworkError(err)) {
        dispatch(openModal({ id: 'network-error' }));
        return;
      }
      if (status === 401) {
        toast.info(t('together:error.signIn'));
        return;
      }
      if (status === 429 && data?.code === 'daily_limit_reached') {
        dispatch(openModal({ id: 'out-of-charges', props: { reason: 'spread' } }));
        return;
      }
      if (data?.code === 'too_many_active') {
        toast.error(t('together:error.tooManyActive'));
        return;
      }
      if (data?.code === 'daily_create_limit') {
        toast.error(t('together:error.dailyCreateLimit'));
        return;
      }
      if (data?.code === 'expired') {
        toast.error(t('together:error.expired'));
        return;
      }
      toast.error(t('together:error.generic'));
    },
    [dispatch, t, toast],
  );

  const submitAuthor = useCallback(
    async (spread: TSpread) => {
      await ensureI18nNamespaces('card');
      const draft = loadPairDraft();
      try {
        const result = await createPair({
          question: (spread.question ?? '').trim(),
          showQuestion: draft.showQuestion,
          inviterName: draft.inviterName.trim(),
          relation: draft.relation,
          language: i18n.language,
          cards: toPairCards(spread, t),
        }).unwrap();
        reachMetrikaGoal(MetrikaGoal.pairCreated, { free: result.isFree });
        haptic.success();
        clearPairDraft();
        navigate(`/pair/${result.id}`, { replace: true });
      } catch (err) {
        handleError(err);
      }
    },
    [createPair, handleError, i18n.language, navigate, t],
  );

  const submitPartner = useCallback(
    async (spread: TSpread, pairId: string) => {
      await ensureI18nNamespaces('card');
      try {
        await submitCards({ id: pairId, cards: toPairCards(spread, t) }).unwrap();
        reachMetrikaGoal(MetrikaGoal.pairPartnerDrawn);
        haptic.success();
        navigate(`/pair/${pairId}`, { replace: true });
      } catch (err) {
        handleError(err);
      }
    },
    [handleError, navigate, submitCards, t],
  );

  return { submitAuthor, submitPartner, busy: creating || submitting };
}
