import { useEffect } from 'react';
import { Platform } from 'react-native';
import { navigationRef } from 'app/navigation/navigationRef';
import { LoadingsContext } from 'shared/contexts/Loadings';
import { useData } from 'shared/DataProvider';
import {
  ensureTelegramWebAppScript,
  initTelegramWebAppChrome,
  isTelegramMiniApp,
} from './telegramWebApp';

function syncTelegramBackButton(blockBack: boolean): void {
  const tg = window.Telegram?.WebApp;
  const backButton = tg?.BackButton;
  if (!backButton) {
    return;
  }

  if (blockBack) {
    backButton.hide();
    return;
  }

  const canGoBack =
    navigationRef.isReady() && navigationRef.canGoBack();

  if (canGoBack) {
    backButton.show();
  } else {
    backButton.hide();
  }
}

/**
 * Telegram Mini App: native back button in the client chrome.
 */
export function useTelegramBackButton(): void {
  const { isFullScreenLoading } = useData({ Context: LoadingsContext });

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      return;
    }

    let disposed = false;
    let clickHandler: (() => void) | null = null;

    const setup = async (): Promise<void> => {
      try {
        await ensureTelegramWebAppScript();
      } catch {
        return;
      }

      if (disposed || !isTelegramMiniApp()) {
        return;
      }

      initTelegramWebAppChrome();

      const backButton = window.Telegram?.WebApp?.BackButton;
      if (!backButton) {
        return;
      }

      clickHandler = () => {
        if (navigationRef.isReady() && navigationRef.canGoBack()) {
          navigationRef.goBack();
        }
      };

      backButton.onClick(clickHandler);

      const interval = window.setInterval(() => {
        syncTelegramBackButton(isFullScreenLoading);
      }, 400);
      syncTelegramBackButton(isFullScreenLoading);

      return () => {
        window.clearInterval(interval);
      };
    };

    let cleanupInterval: (() => void) | undefined;
    void setup().then((cleanup) => {
      cleanupInterval = cleanup;
    });

    return () => {
      disposed = true;
      cleanupInterval?.();
      const backButton = window.Telegram?.WebApp?.BackButton;
      if (backButton && clickHandler) {
        backButton.offClick(clickHandler);
        backButton.hide();
      }
    };
  }, [isFullScreenLoading]);
}
