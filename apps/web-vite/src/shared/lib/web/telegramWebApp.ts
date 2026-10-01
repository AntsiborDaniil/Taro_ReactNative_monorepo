import { store } from '@app/store';
import { userApi } from '@entities/user/api';
import { THEME_CANVAS } from '../theme';
import { trackMetrikaAuthTelegram, trackMetrikaMiniAppOpen } from '../metrika';

import { syncTarotAppHeight } from './lockMobileInputZoom';
// Глобальные типы window.Telegram — см. ./telegram-web-app.d.ts (ambient,
// подхватывается автоматически через tsconfig include, импорт не нужен).

/**
 * Перенос apps/web/src/shared/lib/web/telegramWebApp.ts (без AppMetrica/Яндекс.
 * Метрики и Bearer-backup через setDevAccessToken — сессия web-vite всегда
 * cookie-based на том же origin, см. shared/api/baseApi.ts).
 */
const TELEGRAM_SCRIPT_SRC = 'https://telegram.org/js/telegram-web-app.js';
const TELEGRAM_SCRIPT_ID = 'telegram-web-app-js';
/** Цвет холста текущей темы (data-theme на <html>, см. shared/lib/theme.ts). */
function telegramBg(): string {
  return document.documentElement.dataset.theme === 'light' ? THEME_CANVAS.light : THEME_CANVAS.dark;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** True как только присутствует мост Telegram WebApp (до прихода initData). */
export function isLikelyTelegramMiniApp(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(window.Telegram?.WebApp);
}

export function isTelegramMiniApp(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(window.Telegram?.WebApp?.initData?.trim());
}

export function readTelegramSafeAreaInsets(): { top: number; bottom: number; left: number; right: number } {
  if (typeof window === 'undefined') return { top: 0, bottom: 0, left: 0, right: 0 };
  const inset = window.Telegram?.WebApp?.safeAreaInset;
  if (!inset) return { top: 0, bottom: 0, left: 0, right: 0 };
  return { top: inset.top ?? 0, bottom: inset.bottom ?? 0, left: inset.left ?? 0, right: inset.right ?? 0 };
}

export async function ensureTelegramWebAppScript(): Promise<void> {
  if (typeof document === 'undefined') return;
  if (window.Telegram?.WebApp) return;

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

/**
 * Пробрасывает readTelegramSafeAreaInsets() в CSS-переменные --safe-top/right/
 * bottom/left на :root (инлайн-стиль на documentElement — перебивает
 * env(safe-area-inset-*) из tokens.css, когда Telegram реально отдаёт ненулевой
 * safeAreaInset; вне Telegram или до готовности моста CSS сам падает на env()).
 */
export function applyTelegramSafeAreaCssVars(): void {
  if (typeof document === 'undefined') return;
  const { top, right, bottom, left } = readTelegramSafeAreaInsets();
  const root = document.documentElement.style;
  if (top > 0) root.setProperty('--safe-top', `${top}px`);
  if (right > 0) root.setProperty('--safe-right', `${right}px`);
  if (bottom > 0) root.setProperty('--safe-bottom', `${bottom}px`);
  if (left > 0) root.setProperty('--safe-left', `${left}px`);
}

let safeAreaSubscribed = false;

/** Подписка на viewportChanged/safeAreaChanged — once за время жизни SPA. */
function subscribeTelegramSafeAreaChanges(): void {
  if (safeAreaSubscribed) return;
  const tg = window.Telegram?.WebApp;
  if (!tg?.onEvent) return;
  safeAreaSubscribed = true;
  tg.onEvent('viewportChanged', applyTelegramSafeAreaCssVars);
  tg.onEvent('safeAreaChanged', applyTelegramSafeAreaCssVars);
}

export function initTelegramWebAppChrome(): void {
  const tg = window.Telegram?.WebApp;
  if (!tg) return;

  tg.ready();
  tg.expand();
  tg.setHeaderColor(telegramBg());
  tg.setBackgroundColor(telegramBg());
  applyTelegramSafeAreaCssVars();
  subscribeTelegramSafeAreaChanges();
  syncTarotAppHeight();
  window.setTimeout(() => syncTarotAppHeight(), 100);
  window.setTimeout(() => syncTarotAppHeight(), 400);
  window.setTimeout(() => syncTarotAppHeight(), 1000);
  window.setTimeout(() => applyTelegramSafeAreaCssVars(), 100);
  window.setTimeout(() => applyTelegramSafeAreaCssVars(), 400);
}

async function waitForInitData(timeoutMs = 3000): Promise<string> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const value = window.Telegram?.WebApp?.initData?.trim();
    if (value) return value;
    await sleep(100);
  }
  return window.Telegram?.WebApp?.initData?.trim() || '';
}

async function postTelegramAuth(initData: string): Promise<boolean> {
  const result = await store.dispatch(userApi.endpoints.telegramAuth.initiate({ initData }));
  return userApi.endpoints.telegramAuth.matchFulfilled(result);
}

export type TelegramAuthResult = { inTelegram: boolean; authenticated: boolean };

/** Готовит Telegram-мост и делает тихий логин по initData → /api/auth/telegram. */
export async function tryAuthenticateTelegramMiniApp(): Promise<TelegramAuthResult> {
  if (typeof window === 'undefined') return { inTelegram: false, authenticated: false };

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
    return { inTelegram: true, authenticated: false };
  }
  trackMetrikaMiniAppOpen();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const ok = await postTelegramAuth(initData);
      if (ok) {
        trackMetrikaAuthTelegram();
        return { inTelegram: true, authenticated: true };
      }
    } catch {
      // retry
    }
    await sleep(200 * (attempt + 1));
  }

  return { inTelegram: true, authenticated: false };
}

/**
 * Открыть страницу оплаты (перенос apps/web openExternalPaymentUrl). В Telegram Mini App
 * нужен WebApp.openLink — window.open там часто блокируется; иначе новая вкладка,
 * а если и она заблокирована — переход в текущей.
 */
export function openExternalPaymentUrl(url: string): boolean {
  if (typeof window === 'undefined' || !url.trim()) return false;
  const href = url.trim();
  const webApp = window.Telegram?.WebApp as
    | { openLink?: (link: string, options?: { try_instant_view?: boolean }) => void }
    | undefined;

  if (typeof webApp?.openLink === 'function') {
    try {
      webApp.openLink(href, { try_instant_view: false });
      return true;
    } catch {
      // падаем в window.open ниже
    }
  }

  if (window.open(href, '_blank', 'noopener,noreferrer')) return true;
  window.location.assign(href);
  return true;
}
