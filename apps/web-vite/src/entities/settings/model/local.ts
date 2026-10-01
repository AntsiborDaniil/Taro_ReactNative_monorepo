import { DEFAULT_SETTINGS } from './constants';
import type { TSettings } from './types';

const STORAGE_KEY = 'settings';

/**
 * Гостевые настройки — localStorage, тот же ключ AsyncMemoryKey.Settings
 * ('settings'), что и apps/web (deviceMemory на web пишет в localStorage
 * под этим именем) — формат совместим, см. entities/favorites/model/local.ts
 * для того же паттерна.
 */
export function getLocalSettings(): TSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<TSettings>;
    return {
      sound: { ...DEFAULT_SETTINGS.sound!, ...parsed.sound },
      appearance: { ...DEFAULT_SETTINGS.appearance!, ...parsed.appearance },
      spread: { ...DEFAULT_SETTINGS.spread!, ...parsed.spread },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function setLocalSettings(next: TSettings): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore (quota/private mode)
  }
}

export function patchLocalSettings(patch: Partial<TSettings>): TSettings {
  const current = getLocalSettings();
  const next: TSettings = {
    sound: { ...current.sound!, ...patch.sound },
    appearance: { ...current.appearance!, ...patch.appearance },
    spread: { ...current.spread!, ...patch.spread },
  };
  setLocalSettings(next);
  return next;
}
