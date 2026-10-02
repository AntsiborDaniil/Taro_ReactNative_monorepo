import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input, Text } from '@shared/ui';
import type { ModalComponentProps } from '@shared/ui/ModalSheet';
import { useAppSelector } from '@shared/lib/store';
import { getLegalDocumentById } from '@legacy-legal';
import { markAwaitingLavaPayment, MetrikaGoal, reachMetrikaGoal } from '@shared/lib/metrika';
import { openExternalPaymentUrl } from '@shared/lib/web/telegramWebApp';
import { isCheckoutEmail } from '../lib/isCheckoutEmail';
import { useLavaCheckoutMutation } from '../model/paymentsApi';
import styles from './BuySpreadCreditsModal.module.css';

/** Оферта и возврат рядом с оплатой — требование платёжного провайдера. */
const LEGAL_CONSENT_DOC_IDS = ['offer', 'refund'] as const;

const SYNTHETIC_TG_EMAIL_RE = /^tg\d+@telegram\.mindful\.app$/i;

export type BuySpreadCreditsModalProps = ModalComponentProps & {
  /** 'spread' — из модалки дневного лимита, 'settings' — из настроек. */
  copyNamespace?: 'settings' | 'spread';
};

/**
 * Покупка +3 зарядов: email → Lava checkout → внешняя ссылка.
 */
export function BuySpreadCreditsModal({
  onClose,
  copyNamespace = 'settings',
}: BuySpreadCreditsModalProps): ReactElement {
  const { t: tSettings, i18n } = useTranslation('settings');
  const { t: tSpread } = useTranslation('spread');
  const price = tSpread('dailyLimit.price');
  const dailyLimit = useAppSelector((state) => state.user.tarotDaily?.limit ?? 1);

  const lead =
    copyNamespace === 'spread'
      ? tSpread('dailyLimit.modalLead', { limit: dailyLimit, price })
      : tSettings('credits.buy.modalLead', { price });

  const consentDocs = useMemo(
    () =>
      LEGAL_CONSENT_DOC_IDS.map((id) => getLegalDocumentById(id, i18n.language)).filter(
        (document): document is NonNullable<typeof document> => Boolean(document),
      ),
    [i18n.language],
  );

  const user = useAppSelector((state) => state.user.user);
  const spreadCredits = useAppSelector((state) => state.user.spreadCredits);
  const [lavaCheckout, { isLoading }] = useLavaCheckoutMutation();

  const suggestedEmail = useMemo(() => {
    const email = user?.email?.trim() || '';
    if (!email || SYNTHETIC_TG_EMAIL_RE.test(email)) return '';
    return email;
  }, [user?.email]);

  const [email, setEmail] = useState(suggestedEmail);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    reachMetrikaGoal(MetrikaGoal.buyCreditsOpen);
  }, []);

  const handleBuy = async () => {
    setError(null);
    reachMetrikaGoal(MetrikaGoal.buyCreditsClick);
    const trimmed = email.trim().toLowerCase();
    if (!isCheckoutEmail(trimmed)) {
      setError(tSpread('dailyLimit.emailInvalid'));
      return;
    }

    try {
      const result = await lavaCheckout({ email: trimmed }).unwrap();
      if (!result.paymentUrl) {
        setError(tSpread('dailyLimit.buyFailed'));
        return;
      }
      markAwaitingLavaPayment(spreadCredits ?? 0);
      const opened = openExternalPaymentUrl(result.paymentUrl);
      if (!opened) {
        setError(tSpread('dailyLimit.buyFailed'));
      }
    } catch (err) {
      const rtkError = err as { status?: number; data?: { code?: string; message?: string } };
      const code = rtkError.data?.code;
      if (rtkError.status === 503 || code === 'lava_not_configured') {
        setError(tSpread('dailyLimit.buyUnavailable'));
      } else if (rtkError.status === 401) {
        setError(tSpread('dailyLimit.buyUnauthorized'));
      } else if (rtkError.status === 400 || code === 'invalid_email') {
        setError(rtkError.data?.message?.trim() || tSpread('dailyLimit.emailInvalid'));
      } else {
        setError(rtkError.data?.message?.trim() || tSpread('dailyLimit.buyFailed'));
      }
    }
  };

  return (
    <div className={styles.inner}>
      <Text role="body" tone="ink100" className={styles.lead}>
        {lead}
      </Text>

      {spreadCredits > 0 ? (
        <Text role="micro" tone="ink100" className={styles.balance}>
          {tSettings('credits.buy.modalBalance', { count: spreadCredits })}
        </Text>
      ) : null}

      <div className={styles.emailWrap}>
        <Input
          label={tSpread('dailyLimit.emailLabel')}
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (error) setError(null);
          }}
          autoCapitalize="none"
          autoCorrect="off"
          type="email"
          placeholder={tSpread('dailyLimit.emailPlaceholder')}
          disabled={isLoading}
          error={error ?? undefined}
        />
        <Text role="micro" tone="ink100" className={styles.hint}>
          {tSpread('dailyLimit.emailHint')}
        </Text>
      </div>

      <Button variant="action" fullWidth loading={isLoading} onClick={handleBuy}>
        {isLoading ? tSpread('dailyLimit.buyLoading') : tSpread('dailyLimit.buyCta')}
      </Button>

      <p className={styles.legalRow}>
        {consentDocs.map((document, index) => (
          <span key={document.id}>
            {index > 0 ? <span className={styles.legalSep}>·</span> : null}
            <a
              className={styles.legalLink}
              href={`/legal/${document.slug}.html`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {document.title}
            </a>
          </span>
        ))}
      </p>

      <Button variant="link" className={styles.later} onClick={onClose} disabled={isLoading}>
        {tSpread('dailyLimit.later')}
      </Button>
    </div>
  );
}
