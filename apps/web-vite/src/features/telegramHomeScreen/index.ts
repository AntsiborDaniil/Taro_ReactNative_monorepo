import { registerModal } from '@shared/ui/ModalSheet';
import { AddToHomeScreenModal } from './ui/AddToHomeScreenModal';

// Побочный эффект (импорт из AppShell до ModalRoot): модалка после первого расклада
// и строка в настройках Mini App.
registerModal('add-to-home-screen', {
  titleKey: 'settings:homeScreen.sheetTitle',
  Component: AddToHomeScreenModal,
});

export { AddToHomeScreenModal };
export { maybeOfferAddToHomeScreen } from './lib/maybeOfferAddToHomeScreen';
export {
  readHomeScreenPromptState,
  writeHomeScreenPromptState,
  type HomeScreenPromptState,
} from './lib/promptStorage';
