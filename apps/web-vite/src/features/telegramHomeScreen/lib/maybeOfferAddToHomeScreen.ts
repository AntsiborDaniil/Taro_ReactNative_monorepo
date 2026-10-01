import {
  checkTelegramHomeScreenStatus,
  isTelegramMiniApp,
  supportsAddToHomeScreen,
} from '@shared/lib/web/telegramWebApp';
import { readHomeScreenPromptState, writeHomeScreenPromptState } from './promptStorage';

const OFFER_DELAY_MS = 1400;

/**
 * После первой готовой интерпретации в Mini App — один раз предложить ярлык
 * на домашний экран. Не спрашиваем повторно после отказа / добавления / unsupported.
 */
export async function maybeOfferAddToHomeScreen(openModal: () => void): Promise<void> {
  if (!isTelegramMiniApp() || !supportsAddToHomeScreen()) return;
  if (readHomeScreenPromptState() !== null) return;

  const status = await checkTelegramHomeScreenStatus();
  if (status === 'added') {
    writeHomeScreenPromptState('added');
    return;
  }
  if (status === 'unsupported') {
    writeHomeScreenPromptState('unsupported');
    return;
  }
  // null / unknown / missed — показываем предложение (на unknown клиент всё равно
  // может открыть системный диалог addToHomeScreen).
  if (readHomeScreenPromptState() !== null) return;

  window.setTimeout(() => {
    if (readHomeScreenPromptState() !== null) return;
    openModal();
  }, OFFER_DELAY_MS);
}
