import { registerModal } from '@shared/ui/ModalSheet';
import { BuySpreadCreditsModal } from './ui/BuySpreadCreditsModal';
import { DailyTarotLimitModal } from './ui/DailyTarotLimitModal';
import { NetworkErrorModal } from './ui/NetworkErrorModal';
import { OutOfChargesModal } from './ui/OutOfChargesModal';

// Побочный эффект (импортируется из AppShell.tsx до первого рендера ModalRoot):
// 'buy-credits' / 'daily-limit' / 'out-of-charges' / 'network-error' (интернет при толковании).
registerModal('buy-credits', { titleKey: 'settings:credits.buy.sheetTitle', Component: BuySpreadCreditsModal });
registerModal('daily-limit', { titleKey: 'settings:credits.limit.sheetTitle', Component: DailyTarotLimitModal });
registerModal('out-of-charges', { titleKey: 'spread:outOfCharges.title', Component: OutOfChargesModal });
registerModal('network-error', { titleKey: 'core:ai.network.title', Component: NetworkErrorModal });

export { BuySpreadCreditsModal, DailyTarotLimitModal, NetworkErrorModal, OutOfChargesModal };
export { useLavaCheckoutMutation } from './model/paymentsApi';
export { isCheckoutEmail } from './lib/isCheckoutEmail';
