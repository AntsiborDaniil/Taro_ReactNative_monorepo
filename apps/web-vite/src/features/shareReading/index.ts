import { registerModal } from '@shared/ui/ModalSheet';
import { ShareSheet } from './ui/ShareSheet';

// Побочный эффект (импортируется из AppShell.tsx до первого рендера ModalRoot): лист 'share-reading'.
registerModal('share-reading', { titleKey: 'spread:share.sheetTitle', Component: ShareSheet });

export { ShareSheet };
export { registerShareProvider, getShareProvider } from './model/shareProvider';
export type { ShareProvider } from './model/shareProvider';
export { shareLinkViaChannels } from './lib/shareLink';
export { downloadStoryForSpread } from './lib/storyImage';
