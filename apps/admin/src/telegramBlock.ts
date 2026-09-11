/** Telegram Mini App / in-app WebView must never reach the admin SPA. */
export function isTelegramMiniAppClient(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const tg = (
    window as Window & {
      Telegram?: { WebApp?: { initData?: string; platform?: string } };
    }
  ).Telegram?.WebApp;
  if (tg?.initData) {
    return true;
  }
  if (tg?.platform && tg.platform !== 'unknown') {
    return true;
  }
  return /\bTelegram\b/i.test(navigator.userAgent || '');
}
