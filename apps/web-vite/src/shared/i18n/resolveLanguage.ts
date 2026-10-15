import { languageFromTelegramCode, normalizeLanguage, type AppLanguage } from './namespaces';

export const LANGUAGE_KEY = 'language';
export const LANGUAGE_MANUAL_KEY = 'languageManual';

export function isLanguageManual(): boolean {
  try {
    return window.localStorage.getItem(LANGUAGE_MANUAL_KEY) === '1';
  } catch {
    return false;
  }
}

/** language_code из JSON-поля `user` (initData / tgWebAppData). */
function codeFromInitDataString(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const userRaw = new URLSearchParams(raw).get('user');
    if (!userRaw) return null;
    const code = (JSON.parse(userRaw) as { language_code?: unknown }).language_code;
    return typeof code === 'string' && code ? code : null;
  } catch {
    return null;
  }
}

/** Telegram кладёт launch-параметры в hash (`#tgWebAppData=...`) ещё до загрузки telegram-web-app.js. */
function codeFromLaunchHash(): string | null {
  try {
    const hash = window.location.hash.replace(/^#/, '');
    const data = new URLSearchParams(hash).get('tgWebAppData');
    return codeFromInitDataString(data);
  } catch {
    return null;
  }
}

/** Похоже на запуск внутри Telegram (даже если мост ещё не загрузился). */
export function looksLikeTelegramLaunch(): boolean {
  try {
    if (window.Telegram?.WebApp) return true;
    return /(^|[#&])tgWebApp/.test(window.location.hash);
  } catch {
    return false;
  }
}

/**
 * language_code пользователя Telegram: initDataUnsafe → разбор initData → hash запуска.
 * Работает и до загрузки моста (hash есть сразу).
 */
export function readTelegramLanguageCode(): string | null {
  try {
    const app = window.Telegram?.WebApp;
    const direct = app?.initDataUnsafe?.user?.language_code;
    if (direct) return direct;
    return codeFromInitDataString(app?.initData) ?? codeFromLaunchHash();
  } catch {
    return null;
  }
}

export function readTelegramLanguage(): AppLanguage | null {
  const code = readTelegramLanguageCode();
  return code ? languageFromTelegramCode(code) : null;
}

/** Язык из бота: `WEB_APP_URL?lang=ru|en` на кнопках web_app / Menu Button. */
export function readUrlLanguage(): AppLanguage | null {
  try {
    const raw = new URLSearchParams(window.location.search).get('lang');
    if (raw === 'en' || raw === 'ru') return raw;
    return null;
  } catch {
    return null;
  }
}

export function readSavedLanguage(): AppLanguage | null {
  try {
    const raw = window.localStorage.getItem(LANGUAGE_KEY);
    return raw ? normalizeLanguage(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Язык без ручного выбора: Telegram → ?lang= → null.
 * Telegram важнее ?lang=: Menu Button в чате хранит устаревший ?lang= (кнопка
 * ставится на /start и не обновляется при смене языка клиента), а global-кнопка
 * раньше всегда вела на ?lang=ru.
 */
export function readAutoLanguage(): AppLanguage | null {
  return readTelegramLanguage() ?? readUrlLanguage();
}

/**
 * Старт: ручной выбор → язык Telegram → ?lang= от бота → сохранённый → ru.
 */
export function resolveInitialLanguage(): AppLanguage {
  if (isLanguageManual()) {
    return readSavedLanguage() ?? 'ru';
  }
  return readAutoLanguage() ?? readSavedLanguage() ?? 'ru';
}
