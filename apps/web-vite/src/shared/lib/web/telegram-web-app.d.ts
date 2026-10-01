/**
 * Перенос apps/web/src/shared/lib/web/telegram-web-app.d.ts 1-в-1 (минимальный
 * набор полей Telegram WebApp bridge, которые реально используются).
 */
export {};

declare global {
  interface TelegramWebApp {
    initData?: string;
    /** Разобранный initData; start_param — параметр запуска (например, lava_success). */
    initDataUnsafe?: { start_param?: string };
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
    openLink?: (link: string, options?: { try_instant_view?: boolean }) => void;
  }

  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}
