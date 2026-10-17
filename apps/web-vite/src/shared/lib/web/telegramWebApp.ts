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
  // Bot API 7.7+: вертикальный свайп сворачивал приложение посреди скролла
  // страницы. Выход остаётся через стрелку назад (BackButton) и кнопку закрытия,
  // поэтому подтверждение закрытия включаем, а свайп гасим.
  tg.disableVerticalSwipes?.();
  tg.enableClosingConfirmation?.();
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

type TelegramAuthAttempt = 'ok' | 'invalid' | 'retry';

/**
 * 401/400 — initData отвергнут (подпись/срок), повтор не поможет.
 * Сеть, таймаут, 5xx/504 — обычно холодный старт Render (Free засыпает, будится ~30–60 с):
 * пробуем ещё.
 */
async function postTelegramAuth(initData: string): Promise<TelegramAuthAttempt> {
  const result = await store.dispatch(userApi.endpoints.telegramAuth.initiate({ initData }));
  if (userApi.endpoints.telegramAuth.matchFulfilled(result)) return 'ok';
  const status = 'error' in result ? (result.error as { status?: unknown } | undefined)?.status : undefined;
  return status === 400 || status === 401 ? 'invalid' : 'retry';
}

/** Паузы между попытками: суммарно ~90 с — хватает, чтобы Render проснулся. */
const TELEGRAM_AUTH_RETRY_DELAYS_MS = [1000, 2000, 4000, 8000, 15000, 20000, 30000];

export type TelegramAuthResult = { inTelegram: boolean; authenticated: boolean };

let telegramAuthInflight: Promise<TelegramAuthResult> | null = null;

/**
 * Готовит Telegram-мост и делает тихий логин по initData → /api/auth/telegram.
 * Параллельные вызовы делят одну попытку (повтор по возврату в приложение не дублирует запросы).
 */
export function tryAuthenticateTelegramMiniApp(): Promise<TelegramAuthResult> {
  telegramAuthInflight ??= authenticateTelegramMiniApp().finally(() => {
    telegramAuthInflight = null;
  });
  return telegramAuthInflight;
}

async function authenticateTelegramMiniApp(): Promise<TelegramAuthResult> {
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

  for (let attempt = 0; attempt <= TELEGRAM_AUTH_RETRY_DELAYS_MS.length; attempt += 1) {
    let outcome: TelegramAuthAttempt = 'retry';
    try {
      outcome = await postTelegramAuth(initData);
    } catch {
      // сеть — повторяем
    }
    if (outcome === 'ok') {
      trackMetrikaAuthTelegram();
      return { inTelegram: true, authenticated: true };
    }
    if (outcome === 'invalid') break;
    const delay = TELEGRAM_AUTH_RETRY_DELAYS_MS[attempt];
    if (delay === undefined) break;
    await sleep(delay);
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

/** Статус ярлыка Mini App на домашнем экране (Bot API 8+). */
export type HomeScreenStatus = 'unsupported' | 'unknown' | 'added' | 'missed';

/** Клиент поддерживает Bot API 8+ home screen shortcut. */
export function supportsAddToHomeScreen(): boolean {
  if (typeof window === 'undefined') return false;
  const tg = window.Telegram?.WebApp;
  return typeof tg?.addToHomeScreen === 'function' && typeof tg?.checkHomeScreenStatus === 'function';
}

/**
 * Статус ярлыка на домашнем экране. `null` — не Mini App / API нет / таймаут.
 * На части клиентов до ответа приходит `unknown`.
 */
export function checkTelegramHomeScreenStatus(timeoutMs = 2500): Promise<HomeScreenStatus | null> {
  if (!isTelegramMiniApp() || !supportsAddToHomeScreen()) return Promise.resolve(null);
  const tg = window.Telegram!.WebApp!;

  return new Promise((resolve) => {
    let settled = false;
    const finish = (status: HomeScreenStatus | null) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      resolve(status);
    };
    const timer = window.setTimeout(() => finish(null), timeoutMs);
    try {
      tg.checkHomeScreenStatus?.((status) => finish(status));
    } catch {
      finish(null);
    }
  });
}

/** Нативный диалог Telegram «добавить на домашний экран». */
export function requestTelegramAddToHomeScreen(): boolean {
  if (!isTelegramMiniApp() || !supportsAddToHomeScreen()) return false;
  try {
    window.Telegram!.WebApp!.addToHomeScreen?.();
    return true;
  } catch {
    return false;
  }
}

/** Подписка на успешное добавление ярлыка (событие может прийти и при неопределённом статусе). */
export function onTelegramHomeScreenAdded(callback: () => void): () => void {
  const tg = window.Telegram?.WebApp;
  if (!tg?.onEvent || !tg.offEvent) return () => undefined;
  const handler = () => callback();
  tg.onEvent('homeScreenAdded', handler);
  return () => tg.offEvent?.('homeScreenAdded', handler);
}
