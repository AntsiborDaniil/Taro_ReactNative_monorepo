import { useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { readQuotaCache } from '@shared/lib/quotaCache';
import { useAppDispatch, useAppSelector } from '@shared/lib/store';
import { isLikelyTelegramMiniApp } from '@shared/lib/web/telegramWebApp';
import { LightningIcon } from '../Icon';
import { openModal } from '../ModalSheet';
import styles from './CreditsBadge.module.css';

/**
 * Перенос SpreadCreditsBadge: круг ground700, ободок accent400, молния
 * accent400, счётчик ground800 + кант accent400 + ink50, «+» — accent400 с
 * тёмным знаком. Данные — из userSlice (tarotDaily/spreadCredits); для гостя
 * не рендерится. Клик открывает модалку покупки (см. BuyCreditsModal).
 *
 * Пока /me летит (sessionLoading), бейдж не пропадает: рисуем последнюю
 * известную квоту из localStorage (quotaCache, пишет AppShell), а в Mini App без кэша — «…»
 * (там почти всегда будет вход по initData). Гость без кэша — без бейджа.
 */
export function CreditsBadge(): ReactElement | null {
  const isAuthenticated = useAppSelector((state) => state.user.isAuthenticated);
  const sessionLoading = useAppSelector(
    (state) => state.user.sessionLoading || state.user.authRetryPending,
  );
  const tarotDaily = useAppSelector((state) => state.user.tarotDaily);
  const spreadCredits = useAppSelector((state) => state.user.spreadCredits);
  const { t } = useTranslation('settings');
  const dispatch = useAppDispatch();
  // Кэш читаем один раз на маунт — дальше источник истины Redux.
  const [cached] = useState(readQuotaCache);

  const pending = !isAuthenticated && sessionLoading;
  const showPlaceholder = pending && (cached != null || isLikelyTelegramMiniApp());
  if (!isAuthenticated && !showPlaceholder) {
    return null;
  }

  const live = isAuthenticated && tarotDaily != null;
  const source = live ? { tarotDaily, spreadCredits } : cached;
  const credits = source?.spreadCredits ?? 0;
  const daily = source?.tarotDaily ?? null;
  const quotaReady = daily != null;
  const dailyRemaining = quotaReady ? Math.max(0, daily.limit - daily.used) : 0;
  const remaining = dailyRemaining + credits;
  // Не живые данные (кэш или ничего) — приглушаем, а без кэша показываем «…», не ложный «0».
  const loading = !live;
  const countLabel = !quotaReady
    ? '…'
    : remaining > 99
      ? '99+'
      : String(Math.max(0, Math.floor(remaining)));
  const ariaLabel = !quotaReady
    ? t('credits.badge.a11yLoading')
    : credits > 0
      ? t('credits.badge.a11yCredits', { count: remaining })
      : t('credits.badge.a11yDaily', { count: remaining });

  return (
    <button
      type="button"
      className={[styles.root, loading ? styles.rootLoading : ''].filter(Boolean).join(' ')}
      onClick={() => dispatch(openModal({ id: 'buy-credits' }))}
      aria-label={ariaLabel}
      aria-busy={loading || undefined}
    >
      <LightningIcon width={20} height={20} className={styles.bolt} />
      <span className={`${styles.badge} ${styles.countBadge}`}>{countLabel}</span>
      <span className={`${styles.badge} ${styles.plusBadge}`} aria-hidden="true">
        +
      </span>
    </button>
  );
}
