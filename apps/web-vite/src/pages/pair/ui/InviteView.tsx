import { useEffect, useRef, type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useJoinPairMutation, type PairView } from '@features/pairReading';
import { haptic } from '@shared/lib/haptics';
import { MetrikaGoal, reachMetrikaGoal } from '@shared/lib/metrika';
import { useAppSelector } from '@shared/lib/store';
import { isWebGuestSession } from '@shared/lib/webAuthGate';
import { Button, Text, useToast } from '@shared/ui';
import { MyCards } from './MyCards';
import { PairStepper } from './PairStepper';
import styles from '../Pair.module.css';

const POSITION_KEYS = ['together_pair.cardMeaning.0', 'together_pair.cardMeaning.1', 'together_pair.cardMeaning.2'];

/**
 * Приглашение (партнёр, ещё не тянул): «{Имя} приглашает тебя в расклад на двоих», 3 шага,,
 * вопрос только если автор его раскрыл, карты автора — рубашкой. Гость в вебе
 * жмёт «Войти» (возврат сюда через ?next=), в Mini App вход тихий.
 */
export function InviteView({ pair }: { pair: PairView }): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const isAuthenticated = useAppSelector((state) => state.user.isAuthenticated);
  const sessionLoading = useAppSelector((state) => state.user.sessionLoading);
  const [joinPair, { isLoading: joining }] = useJoinPairMutation();

  const reported = useRef(false);
  useEffect(() => {
    if (reported.current) return;
    reported.current = true;
    reachMetrikaGoal(MetrikaGoal.pairInviteOpen);
  }, []);

  const guest = isWebGuestSession(isAuthenticated, sessionLoading);
  const name = pair.inviterName.trim();
  const backs = POSITION_KEYS.map((key) => ({ card: '', direction: 'upright', label: t(`spread:${key}`) }));

  const handleDraw = async () => {
    if (pair.role === 'partner') {
      navigate(`/reading?pair=${pair.id}`);
      return;
    }
    try {
      await joinPair(pair.id).unwrap();
      haptic.selection();
      navigate(`/reading?pair=${pair.id}`);
    } catch (err) {
      haptic.notify('warning');
      const code = (err as { data?: { code?: string } }).data?.code;
      if (code === 'own_invite') toast.info(t('together:error.ownInvite'));
      else if (code === 'partner_limit') toast.error(t('together:error.partnerLimit'));
      else if (code === 'taken') toast.error(t('together:error.taken'));
      else if (code === 'revoked') toast.error(t('together:error.revoked'));
      else if (code === 'expired') toast.error(t('together:error.expired'));
      else toast.error(t('together:error.generic'));
    }
  };

  const steps = ['step1', 'step2', 'step3'] as const;

  return (
    <>
      <PairStepper step={0} role="partner" />

      <section className={styles.inviteHead}>
        <Text role="title" tone="accent" as="h2">
          {name ? t('together:pair.invite.titleNamed', { name }) : t('together:pair.invite.titleAnon')}
        </Text>
        <Text role="body" tone="ink100">
          {t('together:pair.invite.lead')}
        </Text>
      </section>

      <ol className={styles.steps}>
        {steps.map((key, index) => (
          <li key={key} className={styles.step}>
            <span className={styles.stepIndex}>{index + 1}</span>
            <span>{t(`together:pair.invite.${key}`)}</span>
          </li>
        ))}
      </ol>

      <div className={styles.questionCard}>
        <Text role="label" tone="accent">
          {pair.question ? t('together:pair.invite.questionLabel') : t('together:pair.invite.topicLabel')}
        </Text>
        <Text role="lead" tone="ink50">
          {pair.question ? `«${pair.question}»` : t('together:pair.invite.topic', { context: pair.relation })}
        </Text>
      </div>

      <section className={styles.side}>
        <MyCards cards={backs} nameOf={(card) => card.card} faceDown />
        <Text role="micro" tone="ink100" className={styles.center}>
          {name ? t('together:pair.invite.theirCards', { name }) : t('together:pair.invite.theirCardsAnon')}
        </Text>
      </section>

      <div className={styles.actions}>
        {guest ? (
          <>
            <Text role="micro" tone="ink100" className={styles.center}>
              {t('together:pair.invite.signInHint')}
            </Text>
            <Button
              variant="action"
              fullWidth
              onClick={() => navigate(`/settings/account?next=${encodeURIComponent(`/pair/${pair.id}`)}`)}
            >
              {t('together:pair.invite.signIn')}
            </Button>
          </>
        ) : (
          <Button variant="action" fullWidth loading={joining || sessionLoading} onClick={() => void handleDraw()}>
            {pair.role === 'partner' ? t('together:pair.invite.continue') : t('together:pair.invite.cta')}
          </Button>
        )}
      </div>
    </>
  );
}
