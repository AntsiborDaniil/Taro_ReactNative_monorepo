import { useEffect } from 'react';
import { MetrikaGoal, reachMetrikaGoal } from 'shared/lib';
import BuySpreadCreditsModal from './BuySpreadCreditsModal';

function DailyTarotLimitModal() {
  useEffect(() => {
    reachMetrikaGoal(MetrikaGoal.dailyLimitHit);
  }, []);

  return (
    <BuySpreadCreditsModal
      copyNamespace="spread"
      titleKey="dailyLimit.title"
      bodyKey="dailyLimit.body"
      showBalance={false}
    />
  );
}

export default DailyTarotLimitModal;
