import { useEffect, useState, type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { setCoupleMeta, setQuestion, SpreadName, type TSpread } from '@entities/spread';
import { COUPLE_COST, COUPLE_NAME_MAX, loadCoupleNames, saveCoupleNames } from '@features/couple';
import {
  loadPairDraft,
  PAIR_NAME_MAX,
  PAIR_QUESTION_MAX,
  savePairDraft,
  useGetPairQuotaQuery,
  type PairDraft,
} from '@features/pairReading';
import { baseApi } from '@shared/api/baseApi';
import { haptic } from '@shared/lib/haptics';
import { MetrikaGoal, reachMetrikaGoal } from '@shared/lib/metrika';
import { useAppDispatch, useAppSelector } from '@shared/lib/store';
import { isWebGuestSession } from '@shared/lib/webAuthGate';
import { Button, ChargeMark, Chip, Input, openModal, Switch, Text, Textarea } from '@shared/ui';
import styles from '../SpreadDetail.module.css';
import togetherStyles from './TogetherActions.module.css';

/** Цена пары в зарядах (первая на аккаунт бесплатна — решает сервер, GET /api/pairs/quota). */
const PAIR_COST = 2;

/** «Расклад для друзей»: с кем (партнёр — теперь отдельный «Расклад для парочки»). */
const FRIEND_RELATIONS = ['friend', 'family'] as const;

/**
 * Блок действий «Вместе» на экране описания расклада:
 * - `together_couple` («Для влюблённых»): имя парня, имя девушки, вопрос → выбор 5 карт (⚡2, /interpret);
 * - `together_pair`: с кем расклад (партнёр / друг / близкий), вопрос (обязателен),
 *   «Показать вопрос», подпись приглашения; тексты подстраиваются под связь (i18n context);
 */
export function TogetherActions({ spread }: { spread: TSpread }): ReactElement {
  if (spread.id === SpreadName.Together_Couple) return <CoupleActions />;
  return <PairActions spread={spread} />;
}

/** Хватает ли ⚡ на расклад; пока квота не пришла — пускаем (сервер проверит). */
function useHasCharge(cost: number): boolean {
  const isAuthenticated = useAppSelector((state) => state.user.isAuthenticated);
  const tarotDaily = useAppSelector((state) => state.user.tarotDaily);
  const spreadCredits = useAppSelector((state) => state.user.spreadCredits);
  if (!isAuthenticated || !tarotDaily) return true;
  return Math.max(0, tarotDaily.limit - tarotDaily.used) + (spreadCredits ?? 0) >= cost;
}

function CoupleActions(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const question = useAppSelector((state) => state.spread.question);
  const hasCharge = useHasCharge(COUPLE_COST);
  const [names, setNames] = useState(loadCoupleNames);
  const [errors, setErrors] = useState({ him: false, her: false, question: false });

  useEffect(() => {
    reachMetrikaGoal(MetrikaGoal.coupleOpen);
  }, []);

  const updateNames = (patch: Partial<typeof names>) => {
    const next = { ...names, ...patch };
    setNames(next);
    saveCoupleNames(next);
  };

  const handleStart = () => {
    const him = names.him.trim();
    const her = names.her.trim();
    const next = { him: !him, her: !her, question: !question.trim() };
    setErrors(next);
    if (next.him || next.her || next.question) {
      haptic.notify('warning');
      return;
    }
    if (!hasCharge) {
      haptic.notify('warning');
      dispatch(openModal({ id: 'out-of-charges' }));
      return;
    }
    dispatch(setCoupleMeta({ couple: { him, her } }));
    reachMetrikaGoal(MetrikaGoal.spreadStarted, { spreadId: SpreadName.Together_Couple });
    navigate('/reading');
  };

  return (
    <>
      <div className={styles.panel}>
        <div className={togetherStyles.names}>
          <Input
            label={t('together:couple.form.himLabel')}
            value={names.him}
            onChange={(event) => {
              updateNames({ him: event.target.value.slice(0, COUPLE_NAME_MAX) });
              if (errors.him) setErrors({ ...errors, him: false });
            }}
            placeholder={t('together:couple.form.himPlaceholder')}
            error={errors.him ? t('together:couple.form.nameError') : undefined}
            maxLength={COUPLE_NAME_MAX}
            autoComplete="off"
          />
          <Input
            label={t('together:couple.form.herLabel')}
            value={names.her}
            onChange={(event) => {
              updateNames({ her: event.target.value.slice(0, COUPLE_NAME_MAX) });
              if (errors.her) setErrors({ ...errors, her: false });
            }}
            placeholder={t('together:couple.form.herPlaceholder')}
            error={errors.her ? t('together:couple.form.nameError') : undefined}
            maxLength={COUPLE_NAME_MAX}
            autoComplete="off"
          />
        </div>
        <Text role="label" tone="ink100" as="h2">
          {t('spread:flow.questionSection')}
        </Text>
        <Textarea
          value={question}
          onChange={(event) => {
            dispatch(setQuestion(event.target.value));
            if (errors.question) setErrors({ ...errors, question: false });
          }}
          placeholder={t('together:couple.form.questionPlaceholder')}
          error={errors.question ? t('spread:question.error') : undefined}
          rows={3}
          maxLength={PAIR_QUESTION_MAX}
          showCount
        />
      </div>
      <Button
        variant="action"
        fullWidth
        className={styles.cta}
        onClick={handleStart}
        icon={<ChargeMark cost={COUPLE_COST} size="md" onAction />}
        iconPosition="end"
        aria-label={`${t('together:couple.form.cta')}, ${t('core:charge.a11y', { count: COUPLE_COST })}`}
      >
        {t('together:couple.form.cta')}
      </Button>
    </>
  );
}

function PairActions({ spread }: { spread: TSpread }): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const question = useAppSelector((state) => state.spread.question);
  const isAuthenticated = useAppSelector((state) => state.user.isAuthenticated);
  const sessionLoading = useAppSelector((state) => state.user.sessionLoading);
  const tarotDaily = useAppSelector((state) => state.user.tarotDaily);
  const spreadCredits = useAppSelector((state) => state.user.spreadCredits);

  const [draft, setDraft] = useState<PairDraft>(loadPairDraft);
  const [error, setError] = useState(false);
  const { data: quota } = useGetPairQuotaQuery(undefined, { skip: !isAuthenticated });

  useEffect(() => {
    reachMetrikaGoal(MetrikaGoal.pairCreateOpen);
  }, []);

  // Сервер мог вернуть ⚡ за истёкшие приглашения — обновляем баланс в шапке.
  useEffect(() => {
    if (quota && quota.refundedCharges > 0) dispatch(baseApi.util.invalidateTags(['User']));
  }, [quota, dispatch]);

  const updateDraft = (patch: Partial<PairDraft>) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    savePairDraft(next);
  };

  // i18next context: `key_friend` / `key_family`, для партнёра — базовый ключ.
  const rel = { context: draft.relation };

  const guest = isWebGuestSession(isAuthenticated, sessionLoading);
  const paid = quota ? !quota.freeAvailable : false;
  const free = quota?.freeAvailable === true;

  const handleStart = () => {
    if (sessionLoading) return;
    if (!question.trim()) {
      setError(true);
      return;
    }
    setError(false);
    // Бесплатная пара уже использована, а на ⚡2 не хватает — сразу говорим об этом, не после выбора карт.
    if (paid && tarotDaily) {
      const remaining = Math.max(0, tarotDaily.limit - tarotDaily.used) + (spreadCredits ?? 0);
      if (remaining < PAIR_COST) {
        haptic.notify('warning');
        dispatch(openModal({ id: 'out-of-charges', props: { reason: 'deep' } }));
        return;
      }
    }
    savePairDraft(draft);
    navigate('/reading');
  };

  return (
    <>
      <div className={styles.panel}>
        <div className={togetherStyles.field}>
          <Text role="label" tone="ink100" as="h2">
            {t('together:pair.form.relationLabel')}
          </Text>
          <div className={togetherStyles.chips} role="group" aria-label={t('together:pair.form.relationLabel')}>
            {FRIEND_RELATIONS.map((relation) => (
              <Chip
                key={relation}
                selected={draft.relation === relation}
                onClick={() => {
                  haptic.selection();
                  updateDraft({ relation });
                }}
              >
                {t(`together:pair.relation.${relation}`)}
              </Chip>
            ))}
          </div>
        </div>
        <Text role="label" tone="ink100" as="h2">
          {t('spread:flow.questionSection')}
        </Text>
        <Textarea
          value={question}
          onChange={(event) => {
            dispatch(setQuestion(event.target.value));
            if (error) setError(false);
          }}
          placeholder={t('together:pair.form.questionPlaceholder', rel)}
          error={error ? t('spread:question.error') : undefined}
          rows={3}
          maxLength={PAIR_QUESTION_MAX}
          showCount
        />
        <Switch
          checked={draft.showQuestion}
          onChange={(event) => updateDraft({ showQuestion: event.target.checked })}
          label={t('together:pair.form.showQuestion', rel)}
        />
        <Text role="micro" tone="ink100">
          {t('together:pair.form.showQuestionHint', rel)}
        </Text>
        <Input
          label={t('together:pair.form.nameLabel')}
          value={draft.inviterName}
          onChange={(event) => updateDraft({ inviterName: event.target.value.slice(0, PAIR_NAME_MAX) })}
          placeholder={t('together:pair.form.namePlaceholder')}
          hint={t('together:pair.form.nameHint', rel)}
          maxLength={PAIR_NAME_MAX}
          showCount
          autoComplete="off"
        />
        <Text role="micro" tone="ink100" className={togetherStyles.hint}>
          {t('together:pair.form.partnerHint', rel)}
        </Text>
      </div>

      {guest ? (
        <>
          <Text role="micro" tone="ink100" className={styles.nextHint}>
            {t('together:pair.form.signInHint', rel)}
          </Text>
          <Button
            variant="action"
            fullWidth
            className={styles.cta}
            onClick={() => navigate(`/settings/account?next=${encodeURIComponent(`/spreads/${spread.id}`)}`)}
          >
            {t('together:pair.form.signIn')}
          </Button>
        </>
      ) : (
        <>
          <Button
            variant="action"
            fullWidth
            className={styles.cta}
            onClick={handleStart}
            icon={paid ? <ChargeMark cost={PAIR_COST} size="md" onAction /> : undefined}
            iconPosition="end"
            aria-label={
              paid
                ? `${t('together:pair.form.cta')}, ${t('core:charge.a11y', { count: PAIR_COST })}`
                : undefined
            }
          >
            {t('together:pair.form.cta')}
          </Button>
          {free ? (
            <Text role="micro" tone="accent" className={styles.nextHint}>
              {t('together:pair.form.freeNote')}
            </Text>
          ) : null}
        </>
      )}
    </>
  );
}
