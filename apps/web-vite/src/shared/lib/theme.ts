import { useSyncExternalStore } from 'react';

/**
 * Тема интерфейса DS §02: тёмная (по умолчанию) и светлая. Значения цветов —
 * в styles/tokens.css (:root и [data-theme='light']). Выбор пользователя хранится
 * в localStorage; 'system' следует prefers-color-scheme.
 */
export type ThemePreference = 'dark' | 'light' | 'system';
export type ResolvedTheme = 'dark' | 'light';

const STORAGE_KEY = 'theme';
/** Цвет холста темы — для <meta name="theme-color"> и шапки Telegram. */
export const THEME_CANVAS: Record<ResolvedTheme, string> = {
  dark: '#091519',
  light: '#f2f1e3',
};

const listeners = new Set<() => void>();

function readPreference(): ThemePreference {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'system' ? value : 'dark';
  } catch {
    return 'dark';
  }
}

function systemTheme(): ResolvedTheme {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  return preference === 'system' ? systemTheme() : preference;
}

/** Ставит data-theme на <html> и цвет адресной строки. */
export function applyTheme(preference: ThemePreference = readPreference()): void {
  if (typeof document === 'undefined') return;
  const resolved = resolveTheme(preference);
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
  const meta = document.querySelector('meta[name="theme-color"]');
  meta?.setAttribute('content', THEME_CANVAS[resolved]);
  // Telegram Mini App: шапка и фон клиента — в цвет холста темы.
  const tg = (window as { Telegram?: { WebApp?: { initData?: string; setHeaderColor?: (c: string) => void; setBackgroundColor?: (c: string) => void } } }).Telegram?.WebApp;
  if (tg?.initData) {
    tg.setHeaderColor?.(THEME_CANVAS[resolved]);
    tg.setBackgroundColor?.(THEME_CANVAS[resolved]);
  }
}

export function setThemePreference(preference: ThemePreference): void {
  try {
    localStorage.setItem(STORAGE_KEY, preference);
  } catch {
    // приватный режим — тема применится только на эту сессию
  }
  applyTheme(preference);
  listeners.forEach((listener) => listener());
}

/** Один раз при старте: применить тему и следить за системной, если выбрана 'system'. */
export function initTheme(): void {
  applyTheme();
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
    if (readPreference() === 'system') {
      applyTheme('system');
      listeners.forEach((listener) => listener());
    }
  });
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useThemePreference(): ThemePreference {
  return useSyncExternalStore(subscribe, readPreference, () => 'dark');
}
