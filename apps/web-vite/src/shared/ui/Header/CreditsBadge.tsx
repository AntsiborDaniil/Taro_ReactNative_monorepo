import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@shared/lib/store';
import { LightningIcon } from '../Icon';
import { openModal } from '../ModalSheet';
import styles from './CreditsBadge.module.css';

/**
 * Перенос SpreadCreditsBadge: круг ground700, ободок accent400, молния
 * accent400, счётчик ground800 + кант accent400 + ink50, «+» — accent400 с
 * тёмным знаком. Данные — из userSlice (tarotDaily/spreadCredits); для гостя
 * не рендерится. Клик открывает модалку покупки (см. BuyCreditsModal).
 */
export function CreditsBadge(): ReactElement | null {
  const isAuthenticated = useAppSelector((state) => state.user.isAuthenticated);
  const tarotDaily = useAppSelector((state) => state.user.tarotDaily);
  const spreadCredits = useAppSelector((state) => state.user.spreadCredits);
  const { t } = useTranslation('settings');
  const dispatch = useAppDispatch();

  if (!isAuthenticated) {
    return null;
  }

  const credits = spreadCredits ?? 0;
  const quotaReady = tarotDaily != null;
  const dailyRemaining = quotaReady ? Math.max(0, tarotDaily.limit - tarotDaily.used) : 0;
  const remaining = dailyRemaining + credits;
  // Пока /me не отдал tarotDaily — не рисуем ложный «0».
  const loading = !quotaReady;
  const countLabel = loading
    ? '…'
    : remaining > 99
      ? '99+'
      : String(Math.max(0, Math.floor(remaining)));
  const ariaLabel = loading
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
