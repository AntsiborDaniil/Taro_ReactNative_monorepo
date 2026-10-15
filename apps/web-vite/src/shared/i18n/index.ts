import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import {
  loadLocaleNamespace,
  normalizeLanguage,
  STARTUP_I18N_NAMESPACES,
  type AppLanguage,
} from './namespaces';
import {
  isLanguageManual,
  LANGUAGE_KEY,
  LANGUAGE_MANUAL_KEY,
  looksLikeTelegramLaunch,
  readAutoLanguage,
  readTelegramLanguageCode,
  resolveInitialLanguage,
} from './resolveLanguage';
import { syncDocumentMeta } from './syncDocumentMeta';

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

  watchTelegramLanguage();

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
 * Подтянуть язык после загрузки bridge (script defer) или прихода initData.
 * Приоритет как при старте: язык Telegram → ?lang= от бота.
 * Не трогает ручной выбор пользователя.
 */
export async function syncLanguageFromTelegram(): Promise<AppLanguage | null> {
  if (typeof window === 'undefined' || isLanguageManual()) return null;
  const next = readAutoLanguage();
  if (!next) return null;
  if (normalizeLanguage(i18next.language) === next) return next;
  await applyLanguage(next);
  return next;
}

/**
 * Мост Telegram может появиться уже после старта i18n (defer-скрипт, медленная
 * сеть, initData приходит позже). Если запуск похож на Telegram — до таймаута
 * периодически досинхронизируем язык.
 */
export function watchTelegramLanguage(timeoutMs = 6000, intervalMs = 150): void {
  if (typeof window === 'undefined' || !looksLikeTelegramLaunch()) return;
  const started = Date.now();
  const tick = () => {
    if (isLanguageManual()) return;
    if (readTelegramLanguageCode()) {
      void syncLanguageFromTelegram();
      return;
    }
    if (Date.now() - started < timeoutMs) window.setTimeout(tick, intervalMs);
    else void syncLanguageFromTelegram();
  };
  tick();
}

export const i18nReady = initI18next();

export default i18nReady;
