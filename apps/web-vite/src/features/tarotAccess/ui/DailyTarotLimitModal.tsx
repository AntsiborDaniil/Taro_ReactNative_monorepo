import { useEffect, type ReactElement } from 'react';
import { MetrikaGoal, reachMetrikaGoal } from '@shared/lib/metrika';
import type { ModalComponentProps } from '@shared/ui/ModalSheet';
import { BuySpreadCreditsModal } from './BuySpreadCreditsModal';

/**
 * Лимит дневного слота и зарядов (429) → тот же checkout, что «купить +3».
 */
export function DailyTarotLimitModal(props: ModalComponentProps): ReactElement {
  useEffect(() => {
    reachMetrikaGoal(MetrikaGoal.dailyLimitHit);
  }, []);

  return <BuySpreadCreditsModal {...props} copyNamespace="spread" />;
}
