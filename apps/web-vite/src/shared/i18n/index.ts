import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import {
  languageFromTelegramCode,
  loadLocaleNamespace,
  normalizeLanguage,
  STARTUP_I18N_NAMESPACES,
  type AppLanguage,
} from './namespaces';
import { syncDocumentMeta } from './syncDocumentMeta';

const LANGUAGE_KEY = 'language';
const LANGUAGE_MANUAL_KEY = 'languageManual';

const loadedKeys = new Set<string>();
const inflight = new Map<string, Promise<void>>();

function bundleKey(lng: AppLanguage, ns: string): string {
  return `${lng}:${ns}`;
}

async function loadNamespace(lng: AppLanguage, ns: string): Promise<void> {
  const key = bundleKey(lng, ns);
  if (loadedKeys.has(key) || i18next.hasResourceBundle(lng, ns)) {
    loadedKeys.add(key);
    return;
  }
  const pending = inflight.get(key);
  if (pending) {
    await pending;
    return;
  }
  const promise = (async () => {
    const data = await loadLocaleNamespace(lng, ns);
    i18next.addResourceBundle(lng, ns, data, true, true);
    loadedKeys.add(key);
  })();
  inflight.set(key, promise);
  try {
    await promise;
  } finally {
    inflight.delete(key);
  }
}

/** Подгрузить неймспейсы (card, affirmations, ...) для текущего или указанного языка. */
export async function ensureI18nNamespaces(...args: [...string[], AppLanguage] | string[]) {
  let lng = normalizeLanguage(i18next.language);
  let namespaces = args as string[];
  const last = namespaces[namespaces.length - 1];
  if (last === 'en' || last === 'ru') {
    lng = last;
    namespaces = namespaces.slice(0, -1);
  }
  await Promise.all(namespaces.map((ns) => loadNamespace(lng, ns)));
}

function isLanguageManual(): boolean {
  try {
    return window.localStorage.getItem(LANGUAGE_MANUAL_KEY) === '1';
  } catch {
    return false;
  }
}

function readTelegramLanguage(): AppLanguage | null {
  try {
    const code = window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code;
    if (!code) return null;
    return languageFromTelegramCode(code);
  } catch {
    return null;
  }
}

/** Язык из бота: `WEB_APP_URL?lang=ru|en` на кнопках web_app / Menu Button. */
function readUrlLanguage(): AppLanguage | null {
  try {
    const raw = new URLSearchParams(window.location.search).get('lang');
    if (raw === 'en' || raw === 'ru') return raw;
    return null;
  } catch {
    return null;
  }
}

function readSavedLanguage(): AppLanguage | null {
  try {
    const raw = window.localStorage.getItem(LANGUAGE_KEY);
    return raw ? normalizeLanguage(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Старт: ручной выбор → ?lang= от бота → language_code Telegram → сохранённый → ru.
 */
function resolveInitialLanguage(): AppLanguage {
  if (isLanguageManual()) {
    return readSavedLanguage() ?? 'ru';
  }
  const fromUrl = readUrlLanguage();
  if (fromUrl) return fromUrl;
  const fromTelegram = readTelegramLanguage();
  if (fromTelegram) return fromTelegram;
  return readSavedLanguage() ?? 'ru';
}

async function applyLanguage(lng: AppLanguage): Promise<void> {
  await Promise.all(STARTUP_I18N_NAMESPACES.map((ns) => loadNamespace(lng, ns)));
  await i18next.changeLanguage(lng);
  await syncDocumentMeta(lng);
  try {
    window.localStorage.setItem(LANGUAGE_KEY, lng);
  } catch {
    /* ignore */
  }
}

async function initI18next() {
  const lng = resolveInitialLanguage();

  await i18next.use(initReactI18next).init({
    lng,
    fallbackLng: 'ru',
    defaultNS: 'core',
    ns: [...STARTUP_I18N_NAMESPACES],
    resources: {},
    // Ключи JSON содержат точки буквально: "dailyCard.title".
    keySeparator: false,
    nsSeparator: ':',
    interpolation: { escapeValue: false },
  });

  await Promise.all(STARTUP_I18N_NAMESPACES.map((ns) => loadNamespace(lng, ns)));
  await syncDocumentMeta(lng);

  i18next.on('languageChanged', (nextLng) => {
    void syncDocumentMeta(normalizeLanguage(nextLng));
  });

  return i18next;
}

/** Смена языка из настроек — фиксируем как ручной выбор (не перетираем из Telegram). */
export async function changeLanguage(lng: AppLanguage): Promise<void> {
  await applyLanguage(lng);
  try {
    window.localStorage.setItem(LANGUAGE_MANUAL_KEY, '1');
  } catch {
    /* ignore */
  }
}

/**
 * Подтянуть язык после загрузки bridge (script defer).
 * Приоритет как при старте: ?lang= от бота → language_code Telegram.
 * Не трогает ручной выбор пользователя.
 */
export async function syncLanguageFromTelegram(): Promise<AppLanguage | null> {
  if (typeof window === 'undefined' || isLanguageManual()) return null;
  const next = readUrlLanguage() ?? readTelegramLanguage();
  if (!next) return null;
  if (normalizeLanguage(i18next.language) === next) return next;
  await applyLanguage(next);
  return next;
}

export const i18nReady = initI18next();

export default i18nReady;
