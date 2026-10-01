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

/** Оферта и возврат рядом с оплатой — требование платёжного провайдера. Статические страницы /legal/<slug>.html. */
const LEGAL_CONSENT_DOCS = ['offer', 'refund']
  .map((id) => getLegalDocumentById(id))
  .filter((document): document is NonNullable<typeof document> => Boolean(document));

const SYNTHETIC_TG_EMAIL_RE = /^tg\d+@telegram\.mindful\.app$/i;

export type BuySpreadCreditsModalProps = ModalComponentProps & {
  /** 'spread' — копия дневного лимита (совпадает с DailyTarotLimitModal), 'settings' — обычная покупка. */
  copyNamespace?: 'settings' | 'spread';
};

/**
 * Перенос логики apps/web/src/features/tarotAccess/ui/BuySpreadCreditsModal.tsx
 * (без UI Kitten/RN): email → POST /api/payments/lava/checkout → открыть
 * paymentUrl в новой вкладке. Lava принимает только Яндекс-почту (историческое
 * ограничение) — валидация 1-в-1 со старым кодом.
 */
export function BuySpreadCreditsModal({ onClose, copyNamespace = 'settings' }: BuySpreadCreditsModalProps): ReactElement {
  const { t: tSettings } = useTranslation('settings');
  const { t: tSpread } = useTranslation('spread');
  const tCopy = copyNamespace === 'spread' ? tSpread : tSettings;
  const titleKey = copyNamespace === 'spread' ? 'dailyLimit.title' : 'credits.buy.title';
  const bodyKey = copyNamespace === 'spread' ? 'dailyLimit.body' : 'credits.buy.body';

  const user = useAppSelector((state) => state.user.user);
  const spreadCredits = useAppSelector((state) => state.user.spreadCredits);
  /** Лимит берём из ответа API (tarotDaily), чтобы копия не расходилась с TAROT_DAILY_INTERPRET_LIMIT. */
  const dailyLimit = useAppSelector((state) => state.user.tarotDaily?.limit ?? 1);
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
      // Модалку намеренно не закрываем — оплата открывается в новой вкладке.
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
      <Text role="title" as="h3" tone="ink50" className={styles.title}>
        {tCopy(titleKey)}
      </Text>
      <Text role="body" tone="ink100" className={styles.subtitle}>
        {tCopy(bodyKey, { limit: dailyLimit })}
      </Text>

      {spreadCredits > 0 ? (
        <div className={styles.balanceChip}>
          <Text role="body" tone="accent">
            {tSettings('credits.buy.balance', { count: spreadCredits })}
          </Text>
        </div>
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
        <Text role="micro" tone="ink100">
          {tSpread('dailyLimit.emailHint')}
        </Text>
      </div>

      <Button variant="action" fullWidth loading={isLoading} onClick={handleBuy}>
        {isLoading ? tSpread('dailyLimit.buyLoading') : tSpread('dailyLimit.buyCta')}
      </Button>
      <p className={styles.legalRow}>
        <Text role="micro" tone="ink100">
          {tSpread('dailyLimit.legalNote')}
        </Text>{' '}
        {LEGAL_CONSENT_DOCS.map((document) => (
          <a
            key={document.id}
            className={styles.legalLink}
            href={`/legal/${document.slug}.html`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {document.title}
          </a>
        ))}
      </p>
      <Button variant="quiet" fullWidth onClick={onClose} disabled={isLoading}>
        {tSpread('dailyLimit.later')}
      </Button>
    </div>
  );
}
