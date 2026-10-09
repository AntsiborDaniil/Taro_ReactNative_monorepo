import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import {
  useConsentPairMutation,
  useGetPairQuery,
  useRevokePairMutation,
  type PairView,
} from '@features/pairReading';
import { shareLinkViaChannels } from '@features/shareReading';
import { baseApi } from '@shared/api/baseApi';
import { haptic } from '@shared/lib/haptics';
import { MetrikaGoal, reachMetrikaGoal } from '@shared/lib/metrika';
import { rtkErrorStatus } from '@shared/lib/rtkQueryError';
import { buildPairUrl } from '@shared/lib/sharedReadingLink';
import { copyTextToClipboard } from '@shared/lib/web/copyTextToClipboard';
import { useAppDispatch, useAppSelector } from '@shared/lib/store';
import { AILoader, Button, Header, PageSkeleton, Text, useToast } from '@shared/ui';
import { useCardName } from '@shared/lib/useCardName';
import { InviteView } from './ui/InviteView';
import { MyCards } from './ui/MyCards';
import { PairStepper } from './ui/PairStepper';
import { ResultView } from './ui/ResultView';
import { StatusView } from './ui/StatusView';
import styles from './Pair.module.css';

const UUID_RE = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
/** Пока ждём ответ партнёра / решение — перечитываем состояние раз в полминуты. */
const POLL_MS = 30_000;
const HOUR_MS = 3_600_000;
const POSITION_KEYS = ['together_pair.cardMeaning.0', 'together_pair.cardMeaning.1', 'together_pair.cardMeaning.2'];

function toParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/**
 * «Расклад на двоих» — одна страница-автомат `/pair/:id`. Состояние определяет сервер
 * (GET /api/pairs/:id отдаёт только то, что видит этот зритель):
 * - автор: waiting → ждём партнёра; shared → результат; declined → партнёр оставил карты при себе;
 * - партнёр: invite → выбор карт (/reading?pair=) → consent «Показать / Оставить себе» → результат;
 * - любой: истекла / отменена / слот занят / не найдена → StatusScreen.
 */
export default function PairPage(): ReactElement {
  const { t } = useTranslation();
  const { id = '' } = useParams<{ id: string }>();
  const validId = UUID_RE.test(id);
  const isAuthenticated = useAppSelector((state) => state.user.isAuthenticated);
  const { data: pair, isLoading, error, refetch } = useGetPairQuery(id.toLowerCase(), {
    skip: !validId,
    refetchOnMountOrArgChange: true,
    pollingInterval: POLL_MS,
  });
  const dispatch = useAppDispatch();

  // Автор открыл истёкшее приглашение: сервер вернул ⚡ — обновляем баланс в шапке.
  const refundedExpired = pair?.role === 'author' && pair.status === 'expired' && pair.refunded === true;
  useEffect(() => {
    if (refundedExpired) dispatch(baseApi.util.invalidateTags(['User', 'PairQuota']));
  }, [refundedExpired, dispatch]);

  if (!validId || (error && rtkErrorStatus(error) === 404)) {
    return <StatusView kind="notFound" />;
  }
  if (isLoading || (!pair && !error)) return <PageSkeleton />;
  if (!pair) {
    return (
      <div className={styles.page}>
        <div className={styles.column}>
          <Header title={t('together:pair.headerTitle')} showCredits={isAuthenticated} />
          <Button variant="action" fullWidth onClick={() => void refetch()}>
            {t('together:error.generic')}
          </Button>
        </div>
      </div>
    );
  }

  if (pair.status === 'expired' || pair.status === 'revoked' || pair.status === 'taken') {
    return <StatusView kind={pair.status} pair={pair} />;
  }

  return (
    <div className={styles.page}>
      <div className={styles.column}>
        <Header title={t('together:pair.headerTitle')} showBack={isAuthenticated} showCredits={isAuthenticated} />
        <PairBody pair={pair} />
      </div>
    </div>
  );
}

function PairBody({ pair }: { pair: PairView }): ReactElement {
  if (pair.role === 'author') {
    if (pair.status === 'shared') return <ResultView pair={pair} />;
    if (pair.status === 'declined') return <AuthorDeclined pair={pair} />;
    return <AuthorWaiting pair={pair} />;
  }
  // Партнёр (слот занят им) или посетитель, ещё не занявший слот.
  if (pair.role === 'partner') {
    if (pair.status === 'drawn') return <PartnerConsent pair={pair} />;
    if (pair.status === 'declined') return <PartnerDeclined pair={pair} />;
    if (pair.status === 'shared') return <ResultView pair={pair} />;
  }
  return <InviteView pair={pair} />;
}

/** «2 дня 14 ч» / «5 ч» / «менее часа» — сколько ещё живёт ссылка. */
function timeLeft(iso: string, t: TFunction): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (!Number.isFinite(ms) || ms < HOUR_MS) return t('together:pair.time.lessHour');
  const totalHours = Math.floor(ms / HOUR_MS);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const parts: string[] = [];
  if (days > 0) parts.push(t('together:pair.time.d', { count: days }));
  if (hours > 0) parts.push(t('together:pair.time.h', { count: hours }));
  return parts.join(' ');
}

/** Личное толкование (только автор / партнёр видят своё). */
function PersonalBlock({ text }: { text: string }): ReactElement {
  const { t } = useTranslation();
  return (
    <section className={styles.personal}>
      <Text role="label" tone="accent">
        {t('together:pair.personalTitle')}
      </Text>
      {toParagraphs(text).map((paragraph, index) => (
        <Text key={index} role="body" tone="ink50">
          {paragraph}
        </Text>
      ))}
    </section>
  );
}

function AuthorWaiting({ pair }: { pair: PairView }): ReactElement {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const nameOf = useCardName();
  const [revoke, { isLoading: revoking }] = useRevokePairMutation();
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const url = useMemo(() => buildPairUrl(pair.id), [pair.id]);
  const drawn = pair.status === 'drawn';
  const backs = POSITION_KEYS.map((key) => ({ card: '', direction: 'upright', label: t(`spread:${key}`) }));

  const handleShare = async () => {
    reachMetrikaGoal(MetrikaGoal.pairInviteShare);
    haptic.selection();
    const channel = await shareLinkViaChannels(url, t('together:pair.shareTitle'));
    if (channel === 'clipboard') toast.success(t('together:pair.copied'));
    else if (channel === 'failed') toast.error(t('together:error.generic'));
  };

  const handleCopy = async () => {
    haptic.selection();
    if (await copyTextToClipboard(url)) toast.success(t('together:pair.copied'));
    else toast.error(t('together:error.generic'));
  };

  const handleRevoke = async () => {
    if (!confirmRevoke) {
      haptic.selection();
      setConfirmRevoke(true);
      window.setTimeout(() => setConfirmRevoke(false), 4000);
      return;
    }
    try {
      await revoke(pair.id).unwrap();
      toast.success(t('together:pair.revoked'));
      navigate('/spreads', { replace: true });
    } catch {
      toast.error(t('together:error.generic'));
    }
  };

  return (
    <>
      <PairStepper step={1} role="author" relation={pair.relation} />

      <section className={styles.statusBlock}>
        <Text role="title" tone="accent" as="h2">
          {t('together:pair.waiting.title', { context: pair.relation })}
        </Text>
        <Text role="body" tone="ink100">
          {t('together:pair.waiting.lead')}
        </Text>
      </section>

      <div className={styles.statusPill} role="status">
        <Text role="label" tone="accent">
          {drawn ? t('together:pair.waiting.drawnStatus', { context: pair.relation }) : t('together:pair.waiting.left', { time: timeLeft(pair.expiresAt, t) })}
        </Text>
        {drawn ? (
          <Text role="micro" tone="ink100">
            {t('together:pair.waiting.drawnHint')}
          </Text>
        ) : null}
      </div>

      <section className={styles.side}>
        <Text role="label" tone="accent">
          {t('together:pair.mySide')}
        </Text>
        {pair.question ? (
          <Text role="lead" tone="ink50">
            «{pair.question}»
          </Text>
        ) : null}
        <MyCards cards={pair.authorCards ?? []} nameOf={nameOf} />
        {pair.authorPersonal ? <PersonalBlock text={pair.authorPersonal} /> : null}
      </section>

      <section className={styles.side}>
        <Text role="label" tone="accent">
          {t('together:pair.partnerSide', { context: pair.relation })}
        </Text>
        <MyCards
          cards={backs}
          nameOf={(card) => card.card}
          faceDown
          subCaption={drawn ? t('together:pair.partnerDrawn') : t('together:pair.partnerWaiting')}
        />
      </section>

      <div className={styles.actions}>
        <Button variant="action" fullWidth onClick={() => void handleShare()}>
          {t('together:pair.invite')}
        </Button>
        <Button variant="link" fullWidth onClick={() => void handleCopy()}>
          {t('together:pair.copy')}
        </Button>
        {pair.status === 'waiting' ? (
          <Button variant="link" fullWidth loading={revoking} className={styles.quietLink} onClick={() => void handleRevoke()}>
            {confirmRevoke ? t('together:pair.revokeConfirm') : t('together:pair.revoke')}
          </Button>
        ) : null}
      </div>
    </>
  );
}

function AuthorDeclined({ pair }: { pair: PairView }): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const nameOf = useCardName();
  return (
    <>
      <PairStepper step={1} role="author" relation={pair.relation} />
      <section className={styles.statusBlock}>
        <Text role="title" tone="accent" as="h2">
          {t('together:pair.declined.authorTitle', { context: pair.relation })}
        </Text>
        <Text role="body" tone="ink100">
          {t('together:pair.declined.authorText')}
        </Text>
      </section>
      <section className={styles.side}>
        <Text role="label" tone="accent">
          {t('together:pair.mySide')}
        </Text>
        <MyCards cards={pair.authorCards ?? []} nameOf={nameOf} />
        {pair.authorPersonal ? <PersonalBlock text={pair.authorPersonal} /> : null}
      </section>
      <div className={styles.actions}>
        <Button variant="action" fullWidth onClick={() => navigate('/spreads/together_pair')}>
          {t('together:pair.declined.authorAgain', { context: pair.relation })}
        </Button>
      </div>
    </>
  );
}

function PartnerConsent({ pair }: { pair: PairView }): ReactElement {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const nameOf = useCardName();
  const [consent, { isLoading }] = useConsentPairMutation();

  const handle = async (share: boolean) => {
    haptic.selection();
    try {
      await consent({ id: pair.id, share, language: i18n.language }).unwrap();
      reachMetrikaGoal(share ? MetrikaGoal.pairConsentShared : MetrikaGoal.pairConsentDeclined);
      haptic.success();
    } catch (err) {
      haptic.notify('warning');
      const code = (err as { data?: { code?: string } }).data?.code;
      toast.error(code === 'expired' ? t('together:error.expired') : t('together:error.generic'));
    }
  };

  return (
    <>
      <PairStepper step={1} role="partner" />
      <section className={styles.statusBlock}>
        <Text role="title" tone="accent" as="h2">
          {t('together:pair.consent.title')}
        </Text>
        <Text role="body" tone="ink100">
          {t('together:pair.consent.lead')}
        </Text>
      </section>

      <section className={styles.side}>
        <Text role="label" tone="accent">
          {t('together:pair.consent.yourCards')}
        </Text>
        <MyCards cards={pair.partnerCards ?? []} nameOf={nameOf} />
      </section>

      <div className={styles.choices}>
        <button type="button" className={`${styles.choice} ${styles.choiceShare}`} disabled={isLoading} onClick={() => void handle(true)}>
          <Text role="lead" tone="ink50">
            {t('together:pair.consent.share')}
          </Text>
          <Text role="body" tone="ink100">
            {t('together:pair.consent.shareHint')}
          </Text>
        </button>
        <button type="button" className={styles.choice} disabled={isLoading} onClick={() => void handle(false)}>
          <Text role="lead" tone="ink50">
            {t('together:pair.consent.decline')}
          </Text>
          <Text role="body" tone="ink100">
            {t('together:pair.consent.declineHint')}
          </Text>
        </button>
      </div>
      {isLoading ? <AILoader /> : null}
    </>
  );
}

function PartnerDeclined({ pair }: { pair: PairView }): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const nameOf = useCardName();
  return (
    <>
      <PairStepper step={1} role="partner" />
      <section className={styles.statusBlock}>
        <Text role="title" tone="accent" as="h2">
          {t('together:pair.declined.partnerTitle')}
        </Text>
        <Text role="body" tone="ink100">
          {t('together:pair.declined.partnerText')}
        </Text>
      </section>
      <section className={styles.side}>
        <Text role="label" tone="accent">
          {t('together:pair.consent.yourCards')}
        </Text>
        <MyCards cards={pair.partnerCards ?? []} nameOf={nameOf} />
        {pair.partnerPersonal ? <PersonalBlock text={pair.partnerPersonal} /> : null}
      </section>
      <div className={styles.actions}>
        <Button variant="action" fullWidth onClick={() => navigate('/spreads/simple_daySuggest')}>
          {t('together:pair.result.daily')}
        </Button>
        <Button variant="quiet" quietTone="accent" fullWidth onClick={() => navigate('/spreads/together_pair')}>
          {t('together:pair.result.own')}
        </Button>
      </div>
    </>
  );
}
