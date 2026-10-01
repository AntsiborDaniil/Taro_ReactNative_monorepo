import { readTelegramSafeAreaInsets } from './telegramWebApp';

/**
 * Пробрасывает safe-area (CSS env() + Telegram WebApp.safeAreaInset) в CSS-переменные
 * --safe-top/--safe-right/--safe-bottom/--safe-left на :root. Используется в AppShell/
 * FabNav/Header для отступов под чёлку/жестовую полосу и Telegram Mini App safe area.
 */
function readCssEnvInset(side: 'top' | 'right' | 'bottom' | 'left'): number {
  if (typeof document === 'undefined' || !document.body) return 0;
  const probe = document.createElement('div');
  probe.style.cssText = `position:fixed;visibility:hidden;pointer-events:none;padding-${side}:env(safe-area-inset-${side});`;
  document.body.appendChild(probe);
  const value = Number.parseFloat(getComputedStyle(probe)[`padding${side[0].toUpperCase()}${side.slice(1)}` as 'paddingTop']) || 0;
  document.body.removeChild(probe);
  return value;
}

function applyInsets(): void {
  if (typeof document === 'undefined') return;
  const telegram = readTelegramSafeAreaInsets();
  const root = document.documentElement.style;
  root.setProperty('--safe-top', `${Math.max(readCssEnvInset('top'), telegram.top)}px`);
  root.setProperty('--safe-right', `${Math.max(readCssEnvInset('right'), telegram.right)}px`);
  root.setProperty('--safe-bottom', `${Math.max(readCssEnvInset('bottom'), telegram.bottom)}px`);
  root.setProperty('--safe-left', `${Math.max(readCssEnvInset('left'), telegram.left)}px`);
}

let initialized = false;

/** Разовая инициализация + подписка на изменения (resize, Telegram viewportChanged/safeAreaChanged). */
export function initSafeAreaInsetVars(): void {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  applyInsets();
  window.addEventListener('resize', applyInsets);
  window.addEventListener('orientationchange', applyInsets);

  const tg = window.Telegram?.WebApp;
  tg?.onEvent?.('viewportChanged', applyInsets);
  tg?.onEvent?.('safeAreaChanged', applyInsets);

  // Мост Telegram может подключиться позже (тихий логин/отложенная загрузка скрипта).
  window.setTimeout(applyInsets, 300);
  window.setTimeout(applyInsets, 1000);
}
