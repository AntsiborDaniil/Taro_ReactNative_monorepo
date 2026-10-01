import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import {
  languageFromTelegramCode,
  loadLocaleNamespace,
  normalizeLanguage,
  STARTUP_I18N_NAMESPACES,
  type AppLanguage,
} from './namespaces';

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

function readSavedLanguage(): AppLanguage | null {
  try {
    const raw = window.localStorage.getItem(LANGUAGE_KEY);
    return raw ? normalizeLanguage(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Старт: ручной выбор из настроек → язык Telegram Mini App → сохранённый → ru.
 * В миниаппе без ручного выбора всегда берём language_code клиента Telegram.
 */
function resolveInitialLanguage(): AppLanguage {
  if (isLanguageManual()) {
    return readSavedLanguage() ?? 'ru';
  }
  const fromTelegram = readTelegramLanguage();
  if (fromTelegram) return fromTelegram;
  return readSavedLanguage() ?? 'ru';
}

async function applyLanguage(lng: AppLanguage): Promise<void> {
  await Promise.all(STARTUP_I18N_NAMESPACES.map((ns) => loadNamespace(lng, ns)));
  await i18next.changeLanguage(lng);
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
 * Подтянуть язык из Telegram после загрузки bridge (script defer).
 * Не трогает ручной выбор пользователя.
 */
export async function syncLanguageFromTelegram(): Promise<AppLanguage | null> {
  if (typeof window === 'undefined' || isLanguageManual()) return null;
  const fromTelegram = readTelegramLanguage();
  if (!fromTelegram) return null;
  if (normalizeLanguage(i18next.language) === fromTelegram) return fromTelegram;
  await applyLanguage(fromTelegram);
  return fromTelegram;
}

export const i18nReady = initI18next();

export default i18nReady;
