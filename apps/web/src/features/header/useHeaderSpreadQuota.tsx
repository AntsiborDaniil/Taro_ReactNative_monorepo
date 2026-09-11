import { createElement, useCallback, useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
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
      : 0;
  // Free daily + paid credits — decreases on every successful interpret.
  const remainingTotal = dailyRemaining + credits;

  const quotaBadge = useMemo(() => {
    if (isPractitioner) {
      return { mode: 'unlimited' as const };
    }
    if (!isAuthenticated) {
      return null;
    }
    return {
      mode: (credits > 0 ? 'credits' : 'daily') as SpreadQuotaBadgeMode,
      remaining: remainingTotal,
    };
  }, [credits, isAuthenticated, isPractitioner, remainingTotal]);

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
  size,
}: {
  quota: HeaderSpreadQuota;
  size?: number;
}) {
  const { width } = useWindowDimensions();
  const isCompactMobile = width < 430;
  const resolvedSize = size ?? (isCompactMobile ? 17 : 22);

  return (
    <SpreadCreditsBadge
      mode={quota.mode}
      remaining={quota.remaining}
      size={resolvedSize}
      showTopUpHint={quota.mode !== 'unlimited'}
    />
  );
}
