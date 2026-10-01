import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import {
  loadLocaleNamespace,
  normalizeLanguage,
  STARTUP_I18N_NAMESPACES,
  type AppLanguage,
} from './namespaces';

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

function readSavedLanguage(): AppLanguage {
  try {
    return normalizeLanguage(window.localStorage.getItem('language'));
  } catch {
    return 'ru';
  }
}

async function initI18next() {
  const lng = readSavedLanguage();

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

export async function changeLanguage(lng: AppLanguage): Promise<void> {
  await Promise.all(STARTUP_I18N_NAMESPACES.map((ns) => loadNamespace(lng, ns)));
  await i18next.changeLanguage(lng);
  try {
    window.localStorage.setItem('language', lng);
  } catch {
    /* ignore */
  }
}

export const i18nReady = initI18next();

export default i18nReady;
