import { copyTextToClipboard } from '@shared/lib/web/copyTextToClipboard';
import { isTelegramMiniApp } from '@shared/lib/web/telegramWebApp';

export type ShareChannel = 'telegram' | 'native' | 'clipboard' | 'failed';

/**
 * Отправка ссылки: Mini App → нативный shareURL клиента Telegram (Bot API 8+),
 * иначе navigator.share, иначе копирование в буфер.
 */
export async function shareLinkViaChannels(url: string, title: string): Promise<ShareChannel> {
  const tgShare = window.Telegram?.WebApp?.shareURL;
  if (isTelegramMiniApp() && typeof tgShare === 'function') {
    try {
      tgShare(url, title);
      return 'telegram';
    } catch {
      // fallback ниже
    }
  }

  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ url, title });
      return 'native';
    } catch {
      // отменено или не поддержано — копируем ссылку
    }
  }

  return (await copyTextToClipboard(url)) ? 'clipboard' : 'failed';
}
