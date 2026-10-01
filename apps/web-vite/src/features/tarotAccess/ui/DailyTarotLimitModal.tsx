import { useEffect, type ReactElement } from 'react';
import { MetrikaGoal, reachMetrikaGoal } from '@shared/lib/metrika';
import type { ModalComponentProps } from '@shared/ui/ModalSheet';
import { BuySpreadCreditsModal } from './BuySpreadCreditsModal';

/**
 * Перенос apps/web/src/features/tarotAccess/ui/DailyTarotLimitModal.tsx —
 * тонкая обёртка над BuySpreadCreditsModal с копией дневного лимита. Открывается
 * когда tarotDaily.used >= tarotDaily.limit и spreadCredits <= 0 (entities/spread
 * useInterpretSpreadMutation / reading page), 429 code:'daily_limit_reached'.
 */
export function DailyTarotLimitModal(props: ModalComponentProps): ReactElement {
  useEffect(() => {
    reachMetrikaGoal(MetrikaGoal.dailyLimitHit);
  }, []);

  return <BuySpreadCreditsModal {...props} copyNamespace="spread" />;
}
