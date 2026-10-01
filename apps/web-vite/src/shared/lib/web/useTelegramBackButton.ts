import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ensureTelegramWebAppScript, initTelegramWebAppChrome, isTelegramMiniApp } from './telegramWebApp';

/**
 * Перенос apps/web/src/shared/lib/web/useTelegramBackButton.ts на
 * react-router (вместо React Navigation navigationRef/navReturnStore —
 * которых в web-vite нет): показывает системную кнопку «назад» Telegram
 * Mini App клиента на любом экране кроме главной, клик — useNavigate(-1).
 */
export function useTelegramBackButton(): void {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let disposed = false;
    let clickHandler: (() => void) | null = null;

    const setup = async () => {
      try {
        await ensureTelegramWebAppScript();
      } catch {
        return;
      }
      if (disposed || !isTelegramMiniApp()) return;

      initTelegramWebAppChrome();
      const backButton = window.Telegram?.WebApp?.BackButton;
      if (!backButton) return;

      clickHandler = () => navigate(-1);
      backButton.onClick(clickHandler);

      if (isHome) backButton.hide();
      else backButton.show();
    };

    void setup();

    return () => {
      disposed = true;
      const backButton = window.Telegram?.WebApp?.BackButton;
      if (backButton && clickHandler) {
        backButton.offClick(clickHandler);
      }
    };
  }, [isHome, navigate]);
}
