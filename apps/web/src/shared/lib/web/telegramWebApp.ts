import { Platform } from 'react-native';
import {
  authCredentials,
  getTarotAiApiBaseUrl,
} from 'shared/api';
import { setDevAccessToken } from './devAccessToken';

const TELEGRAM_SCRIPT_SRC = 'https://telegram.org/js/telegram-web-app.js';
const TELEGRAM_SCRIPT_ID = 'telegram-web-app-js';
const AUTH_ME_CACHE_KEY = 'tarot_auth_me_session';

export function isTelegramMiniApp(): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return false;
  }
  return Boolean(window.Telegram?.WebApp?.initData);
}

export function readTelegramSafeAreaInsets(): {
  top: number;
  bottom: number;
  left: number;
  right: number;
} {
  if (typeof window === 'undefined') {
    return { top: 0, bottom: 0, left: 0, right: 0 };
  }

  const inset = window.Telegram?.WebApp?.safeAreaInset;
  if (!inset) {
    return { top: 0, bottom: 0, left: 0, right: 0 };
  }
  return {
    top: inset.top ?? 0,
    bottom: inset.bottom ?? 0,
    left: inset.left ?? 0,
    right: inset.right ?? 0,
  };
}

/** Open Lava checkout (or any https URL) from Mini App / browser. */
export function openExternalPaymentUrl(url: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  const webApp = window.Telegram?.WebApp as
    | { openLink?: (href: string, options?: { try_instant_view?: boolean }) => void }
    | undefined;
  if (typeof webApp?.openLink === 'function') {
    webApp.openLink(url, { try_instant_view: false });
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

export async function ensureTelegramWebAppScript(): Promise<void> {
  if (Platform.OS !== 'web' || typeof document === 'undefined') {
    return;
  }

  if (window.Telegram?.WebApp) {
    return;
  }

  const existing = document.getElementById(TELEGRAM_SCRIPT_ID);
  if (existing) {
    await new Promise<void>((resolve) => {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => resolve(), { once: true });
    });
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.id = TELEGRAM_SCRIPT_ID;
    script.src = TELEGRAM_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('TELEGRAM_SCRIPT_LOAD_FAILED'));
    document.head.appendChild(script);
  });
}

export function initTelegramWebAppChrome(): void {
  const tg = window.Telegram?.WebApp;
  if (!tg) {
    return;
  }

  tg.ready();
  tg.expand();
  tg.setHeaderColor('#171F2C');
  tg.setBackgroundColor('#171F2C');
}

function clearAuthMeCache(): void {
  if (typeof sessionStorage === 'undefined') {
    return;
  }
  try {
    sessionStorage.removeItem(AUTH_ME_CACHE_KEY);
  } catch {
    // ignore
  }
}

/** Silent login in Telegram Mini App via signed initData. */
export async function tryAuthenticateTelegramMiniApp(): Promise<boolean> {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return false;
  }

  try {
    await ensureTelegramWebAppScript();
  } catch {
    return false;
  }

  initTelegramWebAppChrome();

  const initData = window.Telegram?.WebApp?.initData?.trim();
  if (!initData) {
    return false;
  }

  // Always exchange initData — skipping when a cookie/cache session existed
  // left users unregistered after opening the app from the bot keyboard.
  clearAuthMeCache();

  try {
    const response = await fetch(`${getTarotAiApiBaseUrl()}/api/auth/telegram`, {
      method: 'POST',
      credentials: authCredentials(),
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ initData }),
    });

    if (!response.ok) {
      console.warn('[telegram auth] failed', response.status);
      return false;
    }

    const body = (await response.json().catch(() => null)) as {
      token?: string;
    } | null;

    if (typeof body?.token === 'string' && body.token.trim()) {
      // Bearer backup for Telegram WebViews where HttpOnly cookie can race.
      setDevAccessToken(body.token.trim());
    }

    return true;
  } catch (error) {
    console.warn('[telegram auth] error', error);
    return false;
  }
}
