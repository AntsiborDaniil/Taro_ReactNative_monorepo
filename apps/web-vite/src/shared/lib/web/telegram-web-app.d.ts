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

  /** Bot API 6.1+: тактильная отдача (работает и на iOS, в отличие от navigator.vibrate). */
  interface TelegramHapticFeedback {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  }

  interface TelegramWebApp {
    initData?: string;
    HapticFeedback?: TelegramHapticFeedback;
    /** Bot API 7.7+: вернуть свайп вниз после disableVerticalSwipes. */
    enableVerticalSwipes?: () => void;
    /** Bot API 7.8+: опубликовать сторис; media_url — публичный https-URL картинки/видео. */
    shareToStory?: (
      mediaUrl: string,
      params?: { text?: string; widget_link?: { url: string; name?: string } },
    ) => void;
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
    /**
     * Bot API 8+: предложить добавить Mini App на домашний экран телефона.
     * Статус установки — через checkHomeScreenStatus / события homeScreen*.
     */
    addToHomeScreen?: () => void;
    /** Bot API 8+: callback получает unsupported | unknown | added | missed. */
    checkHomeScreenStatus?: (
      callback: (status: 'unsupported' | 'unknown' | 'added' | 'missed') => void,
    ) => void;
  }

  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}
