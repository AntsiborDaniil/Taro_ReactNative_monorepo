/**
 * Минимальный набор полей Telegram WebApp bridge, которые реально используются.
 */
export {};

declare global {
  interface TelegramWebAppUser {
    id?: number;
    language_code?: string;
    first_name?: string;
    last_name?: string;
    username?: string;
  }

  interface TelegramWebApp {
    initData?: string;
    /** Разобранный initData; start_param — параметр запуска (например, lava_success / r_<hex>). */
    initDataUnsafe?: {
      start_param?: string;
      user?: TelegramWebAppUser;
    };
    ready: () => void;
    expand: () => void;
    setHeaderColor: (color: string) => void;
    setBackgroundColor: (color: string) => void;
    safeAreaInset?: { top?: number; bottom?: number; left?: number; right?: number };
    onEvent?: (eventType: string, cb: () => void) => void;
    offEvent?: (eventType: string, cb: () => void) => void;
    BackButton?: {
      show: () => void;
      hide: () => void;
      onClick: (cb: () => void) => void;
      offClick: (cb: () => void) => void;
    };
    /** Bot API 7.7+: отключает свайп вниз, который сворачивает Mini App во время скролла. */
    disableVerticalSwipes?: () => void;
    /** Bot API 6.2+: спрашивать подтверждение при закрытии Mini App. */
    enableClosingConfirmation?: () => void;
    openLink?: (link: string, options?: { try_instant_view?: boolean }) => void;
    openTelegramLink?: (url: string) => void;
    /** Bot API 8+: диалог «поделиться» URL внутри клиента Telegram. */
    shareURL?: (url: string, text?: string) => void;
  }

  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}
