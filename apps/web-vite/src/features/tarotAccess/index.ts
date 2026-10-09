import { lazy } from 'react';
import { registerModal } from '@shared/ui/ModalSheet';

// Тела модалок грузятся лениво (ModalRoot оборачивает рендер в Suspense) — не раздувают главный чанк.
const BuySpreadCreditsModal = lazy(() =>
  import('./ui/BuySpreadCreditsModal').then((m) => ({ default: m.BuySpreadCreditsModal })),
);
const DailyTarotLimitModal = lazy(() =>
  import('./ui/DailyTarotLimitModal').then((m) => ({ default: m.DailyTarotLimitModal })),
);
const NetworkErrorModal = lazy(() => import('./ui/NetworkErrorModal').then((m) => ({ default: m.NetworkErrorModal })));
const OutOfChargesModal = lazy(() => import('./ui/OutOfChargesModal').then((m) => ({ default: m.OutOfChargesModal })));

// Побочный эффект (импортируется из AppShell.tsx до первого рендера ModalRoot):
// 'buy-credits' / 'daily-limit' / 'out-of-charges' / 'network-error' (интернет при толковании).
registerModal('buy-credits', { titleKey: 'settings:credits.buy.sheetTitle', Component: BuySpreadCreditsModal });
registerModal('daily-limit', { titleKey: 'settings:credits.limit.sheetTitle', Component: DailyTarotLimitModal });
registerModal('out-of-charges', { titleKey: 'spread:outOfCharges.title', Component: OutOfChargesModal });
registerModal('network-error', { titleKey: 'core:ai.network.title', Component: NetworkErrorModal });

export { useLavaCheckoutMutation } from './model/paymentsApi';
export { isCheckoutEmail } from './lib/isCheckoutEmail';
