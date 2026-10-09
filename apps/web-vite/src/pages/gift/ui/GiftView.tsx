import { useMemo, useState, type ReactElement } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TarotCardFace } from '@entities/spread';
import { TarotCardDirection } from '@legacy-data';
import { useGetGiftQuery, useOpenGiftMutation, type GiftView as GiftViewData } from '@features/giftCard';
import { shareLinkViaChannels } from '@features/shareReading';
import { haptic } from '@shared/lib/haptics';
import { getImage } from '@shared/lib/getImage';
import { MetrikaGoal, reachMetrikaGoal } from '@shared/lib/metrika';
import { rtkErrorStatus } from '@shared/lib/rtkQueryError';
import { buildGiftUrl } from '@shared/lib/sharedReadingLink';
import { useAppSelector } from '@shared/lib/store';
import { useCardName } from '@shared/lib/useCardName';
import { copyTextToClipboard } from '@shared/lib/web/copyTextToClipboard';
import { Button, Header, PageSkeleton, StatusScreen, Text, useToast } from '@shared/ui';
import { GiftPreview } from './GiftPreview';
import styles from '../Gift.module.css';

const UUID_RE = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

function toParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/**
 * `/gift/:id` — «Карта для друга». Публичная страница (без входа, без навигации для гостя):
 * - владелец: «Открытка готова», превью как у получателя, статус «Ещё не открыта / Открыта …», «Отправить»;
 * - получатель: «{Имя}, эта карта вытянута для тебя», записка, карта рубашкой → тап → переворот
 *   → имя карты, прямая/перевёрнутая, послание, затем два CTA.
 */
export default function GiftPage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id = '' } = useParams<{ id: string }>();
  const validId = UUID_RE.test(id);
  const isAuthenticated = useAppSelector((state) => state.user.isAuthenticated);
  const { data: gift, isLoading, error } = useGetGiftQuery(id.toLowerCase(), {
    skip: !validId,
    refetchOnMountOrArgChange: true,
  });

  if (!validId || (error && rtkErrorStatus(error) === 404) || (error && rtkErrorStatus(error) === 410)) {
    const expired = Boolean(validId && error && rtkErrorStatus(error) === 410);
    const kind = expired ? 'expired' : 'notFound';
    return (
      <StatusScreen
        image={getImage(['core', 'notFound'])}
        title={t(`together:gift.status.${kind}.title`)}
        description={t(`together:gift.status.${kind}.text`)}
        action={
          <Button variant="action" fullWidth onClick={() => navigate('/spreads/simple_daySuggest')}>
            {t('together:gift.recipient.daily')}
          </Button>
        }
      />
    );
  }
  if (isLoading || !gift) return <PageSkeleton />;

  return (
    <div className={styles.page}>
      <div className={styles.column}>
        <Header title="" showBack={isAuthenticated && gift.isOwner} showCredits={isAuthenticated} />
        {gift.isOwner ? <OwnerView gift={gift} /> : <RecipientView gift={gift} />}
      </div>
    </div>
  );
}

function formatOpened(iso: string, lang: string): string {
  try {
    return new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(
      new Date(iso),
    );
  } catch {
    return iso;
  }
}

function OwnerView({ gift }: { gift: GiftViewData }): ReactElement {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const nameOf = useCardName();
  const url = useMemo(() => buildGiftUrl(gift.id), [gift.id]);
  const name = gift.recipientName.trim();
  const reversed = gift.card.direction === 'reversed';

  const handleShare = async () => {
    reachMetrikaGoal(MetrikaGoal.giftShare);
    haptic.selection();
    const channel = await shareLinkViaChannels(url, t('together:gift.owner.shareTitle'));
    if (channel === 'clipboard') toast.success(t('together:gift.owner.copied'));
    else if (channel === 'failed') toast.error(t('together:error.generic'));
  };

  const handleCopy = async () => {
    haptic.selection();
    if (await copyTextToClipboard(url)) toast.success(t('together:gift.owner.copied'));
    else toast.error(t('together:error.generic'));
  };

  const who = name ? t('together:gift.owner.whoNamed', { name }) : t('together:gift.owner.whoAnon');
  const openedDate = gift.openedAt ? formatOpened(gift.openedAt, i18n.language) : '';

  return (
    <>
      <section className={styles.titleBlock}>
        <Text role="title" tone="accent" as="h2">
          {t('together:gift.owner.title')}
        </Text>
        <Text role="body" tone="ink100">
          {t('together:gift.owner.hint', { who })}
        </Text>
      </section>

      <GiftPreview
        recipientName={gift.recipientName}
        occasion={gift.occasion}
        note={gift.note}
        caption={t('together:gift.owner.previewLabel')}
      />

      <div className={gift.opened ? `${styles.statusPill} ${styles.statusPillOpened}` : styles.statusPill} role="status">
        <Text role="label" tone={gift.opened ? 'accent' : 'ink100'}>
          {gift.opened
            ? t('together:gift.owner.statusOpened', { date: openedDate })
            : t('together:gift.owner.statusNotOpened')}
        </Text>
      </div>

      <div className={styles.actions}>
        <Button variant="action" fullWidth onClick={() => void handleShare()}>
          {t('together:gift.owner.send')}
        </Button>
        <Button variant="link" fullWidth onClick={() => void handleCopy()}>
          {t('together:gift.owner.copy')}
        </Button>
      </div>

      <section className={styles.side}>
        <div className={styles.cardWrap}>
          <span className={styles.cardFace}>
            <TarotCardFace
              cardId={gift.card.card_id}
              direction={reversed ? TarotCardDirection.Reversed : TarotCardDirection.Upright}
            />
          </span>
        </div>
        <Text role="lead" tone="ink50" className={styles.center}>
          {nameOf(gift.card)} · {reversed ? t('together:gift.recipient.reversed') : t('together:gift.recipient.upright')}
        </Text>
        <div className={styles.message}>
          {toParagraphs(gift.message).map((paragraph, index) => (
            <Text key={index} role="body" tone="ink50">
              {paragraph}
            </Text>
          ))}
        </div>
      </section>

    </>
  );
}

function RecipientView({ gift }: { gift: GiftViewData }): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const nameOf = useCardName();
  const [openGift] = useOpenGiftMutation();
  const [flipped, setFlipped] = useState(false);
  const name = gift.recipientName.trim();
  const reversed = gift.card.direction === 'reversed';

  const handleFlip = () => {
    if (flipped) return;
    setFlipped(true);
    haptic.impact('medium');
    reachMetrikaGoal(MetrikaGoal.giftOpen, { occasion: gift.occasion });
    // Первое открытие: сервер уведомит отправителя (один раз). Сбой на экран не влияет.
    void openGift(gift.id);
  };

  return (
    <>
      <section className={styles.titleBlock}>
        <Text role="title" tone="accent" as="h2">
          {name ? t('together:gift.recipient.titleNamed', { name }) : t('together:gift.recipient.titleAnon')}
        </Text>
      </section>

      {gift.note ? (
        <section className={styles.note}>
          <Text role="label" tone="accent">
            {t('together:gift.recipient.note')}
          </Text>
          <Text role="lead" tone="ink50">
            «{gift.note}»
          </Text>
        </section>
      ) : null}

      <button
        type="button"
        className={flipped ? `${styles.flip} ${styles.flipped}` : `${styles.flip} ${styles.pulse}`}
        onClick={handleFlip}
        aria-label={flipped ? nameOf(gift.card) : t('together:gift.recipient.tap')}
        aria-pressed={flipped}
      >
        <span className={styles.flipInner}>
          <span className={`${styles.flipSide} ${styles.flipFront}`}>
            <TarotCardFace faceDown />
          </span>
          <span className={`${styles.flipSide} ${styles.flipBack}`}>
            <TarotCardFace
              cardId={gift.card.card_id}
              direction={reversed ? TarotCardDirection.Reversed : TarotCardDirection.Upright}
            />
          </span>
        </span>
      </button>

      {flipped ? (
        <>
          <section className={styles.reveal}>
            <Text role="title" tone="ink50" as="h3">
              {nameOf(gift.card)}
            </Text>
            <Text role="label" tone="accent">
              {reversed ? t('together:gift.recipient.reversed') : t('together:gift.recipient.upright')}
            </Text>
            <Text role="label" tone="ink100" className={styles.messageLabel}>
              {t('together:gift.recipient.message')}
            </Text>
            <div className={styles.message}>
              {toParagraphs(gift.message).map((paragraph, index) => (
                <Text key={index} role="body" tone="ink50">
                  {paragraph}
                </Text>
              ))}
            </div>
          </section>

          <div className={styles.actions}>
            <Button
              variant="action"
              fullWidth
              onClick={() => {
                reachMetrikaGoal(MetrikaGoal.giftCtaDailyClick);
                navigate('/spreads/simple_daySuggest');
              }}
            >
              {t('together:gift.recipient.daily')}
            </Button>
          </div>
        </>
      ) : (
        <Text role="lead" tone="accent" className={`${styles.center} ${styles.tapHint}`}>
          {t('together:gift.recipient.tap')}
        </Text>
      )}
    </>
  );
}
