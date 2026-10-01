import { Platform } from 'react-native';
import {
  authCredentials,
  getTarotAiApiBaseUrl,
} from 'shared/api';
import { DS_COLORS } from 'shared/themes/ds';
import { setDevAccessToken } from './devAccessToken';
import { syncTarotAppHeight } from './lockMobileInputZoom';
import {
  trackMetrikaAuthTelegram,
  trackMetrikaMiniAppOpen,
} from './yandexMetrika';

const TELEGRAM_SCRIPT_SRC = 'https://telegram.org/js/telegram-web-app.js';
const TELEGRAM_SCRIPT_ID = 'telegram-web-app-js';
const AUTH_ME_CACHE_KEY = 'tarot_auth_me_session';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** True when Telegram WebApp bridge is present (even before initData arrives). */
export function isLikelyTelegramMiniApp(): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return false;
  }
  return Boolean(window.Telegram?.WebApp);
}

export function isTelegramMiniApp(): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return false;
  }
  return Boolean(window.Telegram?.WebApp?.initData?.trim());
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

/** Open Lava checkout (or any https URL) from Mini App / browser.
 * Returns false only when nothing could be attempted.
 */
export function openExternalPaymentUrl(url: string): boolean {
  if (typeof window === 'undefined' || !url.trim()) {
    return false;
  }

  const href = url.trim();
  const webApp = window.Telegram?.WebApp as
    | {
        openLink?: (
          link: string,
          options?: { try_instant_view?: boolean }
        ) => void;
      }
    | undefined;

  // Telegram Desktop Mini App: openLink is required; window.open is often blocked.
  if (typeof webApp?.openLink === 'function') {
    try {
      webApp.openLink(href, { try_instant_view: false });
      return true;
    } catch (error) {
      console.warn('[payment] Telegram openLink failed, falling back', error);
    }
  }

  const popup = window.open(href, '_blank', 'noopener,noreferrer');
  if (popup) {
    return true;
  }

  // Popup blocked — navigate same tab as last resort.
  window.location.assign(href);
  return true;
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
  // Bot API 7.7+: вертикальный свайп сворачивал приложение посреди скролла.
  tg.disableVerticalSwipes?.();
  tg.enableClosingConfirmation?.();
  tg.setHeaderColor(DS_COLORS.ground900);
  tg.setBackgroundColor(DS_COLORS.ground900);
  // Desktop Mini App often expands after ready — sync layout height.
  syncTarotAppHeight();
  if (typeof window !== 'undefined') {
    window.setTimeout(() => syncTarotAppHeight(), 100);
    window.setTimeout(() => syncTarotAppHeight(), 400);
    window.setTimeout(() => syncTarotAppHeight(), 1000);
  }
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

async function waitForInitData(timeoutMs = 3000): Promise<string> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const value = window.Telegram?.WebApp?.initData?.trim();
    if (value) {
      return value;
    }
    await sleep(100);
  }
  return window.Telegram?.WebApp?.initData?.trim() || '';
}

async function postTelegramAuth(initData: string): Promise<boolean> {
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

  trackMetrikaAuthTelegram();
  return true;
}

export type TelegramAuthResult = {
  inTelegram: boolean;
  authenticated: boolean;
};

/**
 * Prepare Telegram bridge and ensure a session exists.
 * - Checks / prepares chrome
 * - If already have a valid flow: force exchange initData when `force`
 * - Retries initData + auth (Desktop race)
 */
export async function tryAuthenticateTelegramMiniApp(options?: {
  force?: boolean;
}): Promise<TelegramAuthResult> {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return { inTelegram: false, authenticated: false };
  }

  try {
    await ensureTelegramWebAppScript();
  } catch {
    return { inTelegram: false, authenticated: false };
  }

  if (!window.Telegram?.WebApp) {
    return { inTelegram: false, authenticated: false };
  }

  initTelegramWebAppChrome();

  const initData = await waitForInitData();
  if (!initData) {
    console.warn('[telegram auth] initData missing');
    return { inTelegram: true, authenticated: false };
  }

  trackMetrikaMiniAppOpen();
  clearAuthMeCache();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const ok = await postTelegramAuth(initData);
      if (ok) {
        return { inTelegram: true, authenticated: true };
      }
    } catch (error) {
      console.warn('[telegram auth] error', error);
    }
    await sleep(200 * (attempt + 1));
  }

  return { inTelegram: true, authenticated: false };
}
