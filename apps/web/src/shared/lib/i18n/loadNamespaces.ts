import { Platform } from 'react-native';
import i18next from 'i18next';

export const ALLOWED_I18N_LANGUAGES = ['en', 'ru'] as const;
export type AppLanguage = (typeof ALLOWED_I18N_LANGUAGES)[number];

export const STARTUP_I18N_NAMESPACES = [
  'core',
  'main',
  'settings',
  'spread',
  'characteristics',
  'subscriptions',
  'hello',
  'moodAndEnergy',
  'habits',
  'achievements',
] as const;

/** Loaded on demand — card.json is ~13–23 MB (fetch on web, import on native). */
export const LAZY_I18N_NAMESPACES = ['card', 'affirmations'] as const;

type StartupNamespace = (typeof STARTUP_I18N_NAMESPACES)[number];
type LazyNamespace = (typeof LAZY_I18N_NAMESPACES)[number];

const loadedKeys = new Set<string>();
const inflight = new Map<string, Promise<void>>();

function bundleKey(lng: AppLanguage, ns: string): string {
  return `${lng}:${ns}`;
}

function normalizeLanguage(lng: string): AppLanguage {
  return ALLOWED_I18N_LANGUAGES.includes(lng as AppLanguage)
    ? (lng as AppLanguage)
    : 'en';
}

/** Native fallback when JSON is not served as a static file. */
const NATIVE_LAZY_LOADERS: Record<
  AppLanguage,
  Record<LazyNamespace, () => Promise<{ default?: Record<string, unknown> }>>
> = {
  en: {
    card: () => import('locales/en/card.json'),
    affirmations: () => import('locales/en/affirmations.json'),
  },
  ru: {
    card: () => import('locales/ru/card.json'),
    affirmations: () => import('locales/ru/affirmations.json'),
  },
};

async function loadLazyNamespaceWeb(
  lng: AppLanguage,
  ns: LazyNamespace
): Promise<void> {
  const response = await fetch(`/locales/${lng}/${ns}.json`, {
    cache: 'force-cache',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch /locales/${lng}/${ns}.json (${response.status})`);
  }

  const data = (await response.json()) as Record<string, unknown>;
  i18next.addResourceBundle(lng, ns, data, true, true);
}

async function loadLazyNamespaceNative(
  lng: AppLanguage,
  ns: LazyNamespace
): Promise<void> {
  const mod = await NATIVE_LAZY_LOADERS[lng][ns]();
  const data = mod.default ?? mod;
  i18next.addResourceBundle(lng, ns, data, true, true);
}

async function loadLazyNamespace(lng: AppLanguage, ns: LazyNamespace): Promise<void> {
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
    if (Platform.OS === 'web') {
      try {
        await loadLazyNamespaceWeb(lng, ns);
      } catch {
        /* dev: JSON not in public/ — fall back to metro dynamic import */
        await loadLazyNamespaceNative(lng, ns);
      }
    } else {
      await loadLazyNamespaceNative(lng, ns);
    }
    loadedKeys.add(key);
  })();

  inflight.set(key, promise);

  try {
    await promise;
  } finally {
    inflight.delete(key);
  }
}

/** Load heavy namespaces (card, affirmations). */
export async function ensureI18nNamespaces(
  ...args: [...string[], AppLanguage] | string[]
): Promise<void> {
  let lng = normalizeLanguage(i18next.language || 'en');
  let namespaces = args as string[];

  const last = namespaces[namespaces.length - 1];
  if (last === 'en' || last === 'ru') {
    lng = last;
    namespaces = namespaces.slice(0, -1);
  }

  await Promise.all(
    namespaces.map((ns) => {
      if (!LAZY_I18N_NAMESPACES.includes(ns as LazyNamespace)) {
        return Promise.resolve();
      }
      return loadLazyNamespace(lng, ns as LazyNamespace);
    })
  );
}

/** Preload card texts during idle (web: static JSON in /locales). */
export function preloadCardTranslationsIdle(): void {
  const run = () => {
    void ensureI18nNamespaces('card').catch(() => {
      /* optional prefetch — ignore failures */
    });
  };

  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(run, { timeout: 12000 });
    return;
  }

  setTimeout(run, 4000);
}
