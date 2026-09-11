import { createElement, useCallback, useMemo } from 'react';
import AppMetrica from '@appmetrica/react-native-analytics';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { UserContext } from 'entities/user';
import { useTranslation } from 'react-i18next';
import {
  BuySpreadCreditsModal,
  SpreadCreditsBadge,
  type SpreadQuotaBadgeMode,
} from 'features/tarotAccess/ui';
import { useData } from 'shared/DataProvider';
import { AnalyticAction } from 'shared/types';
import { ModalsContext } from 'shared/ui/ModalsProvider';

export type HeaderSpreadQuota = {
  mode: SpreadQuotaBadgeMode;
  remaining?: number;
  a11yLabel: string;
  onPress: () => void;
};

/** Shared quota chip for Header (and Settings). */
export function useHeaderSpreadQuota(): HeaderSpreadQuota | null {
  const { t } = useTranslation('settings');
  const { spreadCredits, tarotDaily, isPractitioner, isAuthenticated } =
    useData({ Context: UserContext });
  const { handleVibrationClick } = useData({
    Context: ApplicationConfigContext,
  });
  const { showModal } = useData({ Context: ModalsContext });

  const credits = spreadCredits ?? 0;
  const dailyRemaining =
    tarotDaily != null
      ? Math.max(0, tarotDaily.limit - tarotDaily.used)
      : null;

  const quotaBadge = useMemo(() => {
    if (isPractitioner) {
      return { mode: 'unlimited' as const };
    }
    if (credits > 0) {
      return { mode: 'credits' as const, remaining: credits };
    }
    if (isAuthenticated && dailyRemaining != null) {
      return { mode: 'daily' as const, remaining: dailyRemaining };
    }
    return null;
  }, [credits, dailyRemaining, isAuthenticated, isPractitioner]);

  const openBuyCredits = useCallback(async () => {
    AppMetrica.reportEvent(AnalyticAction.ClickSettingsSegment, {
      segment: 'credits.buy',
    });
    await handleVibrationClick?.();
    showModal?.(createElement(BuySpreadCreditsModal));
  }, [handleVibrationClick, showModal]);

  return useMemo(() => {
    if (!quotaBadge) {
      return null;
    }

    const a11yLabel =
      quotaBadge.mode === 'unlimited'
        ? t('credits.badge.a11yUnlimited')
        : quotaBadge.mode === 'credits'
          ? t('credits.badge.a11yCredits', { count: quotaBadge.remaining })
          : t('credits.badge.a11yDaily', { count: quotaBadge.remaining });

    return {
      mode: quotaBadge.mode,
      remaining:
        quotaBadge.mode === 'unlimited' ? undefined : quotaBadge.remaining,
      a11yLabel,
      onPress: openBuyCredits,
    };
  }, [openBuyCredits, quotaBadge, t]);
}

export function HeaderSpreadQuotaBadge({
  quota,
  size = 22,
}: {
  quota: HeaderSpreadQuota;
  size?: number;
}) {
  return (
    <SpreadCreditsBadge
      mode={quota.mode}
      remaining={quota.remaining}
      size={size}
    />
  );
}
