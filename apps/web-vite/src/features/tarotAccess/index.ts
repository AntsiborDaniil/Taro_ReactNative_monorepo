import { registerModal } from '@shared/ui/ModalSheet';
import { BuySpreadCreditsModal } from './ui/BuySpreadCreditsModal';
import { DailyTarotLimitModal } from './ui/DailyTarotLimitModal';

// Побочный эффект (импортируется из AppShell.tsx до первого рендера ModalRoot):
// регистрирует модалки 'buy-credits' (Header → CreditsBadge) и 'daily-limit'
// (исчерпан дневной лимит/кредиты — открывается из pages/reading).
registerModal('buy-credits', { titleKey: 'settings:credits.buy.sheetTitle', Component: BuySpreadCreditsModal });
registerModal('daily-limit', { titleKey: 'settings:credits.limit.sheetTitle', Component: DailyTarotLimitModal });

export { BuySpreadCreditsModal, DailyTarotLimitModal };
export { useLavaCheckoutMutation } from './model/paymentsApi';
export { isCheckoutEmail } from './lib/isCheckoutEmail';
