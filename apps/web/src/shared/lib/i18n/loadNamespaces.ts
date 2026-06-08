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

export const LAZY_I18N_NAMESPACES = ['card', 'affirmations'] as const;

type StartupNamespace = (typeof STARTUP_I18N_NAMESPACES)[number];
type LazyNamespace = (typeof LAZY_I18N_NAMESPACES)[number];
type AnyNamespace = StartupNamespace | LazyNamespace;

const ALL_FETCH_NAMESPACES: readonly AnyNamespace[] = [
  ...STARTUP_I18N_NAMESPACES,
  ...LAZY_I18N_NAMESPACES,
];

const loadedKeys = new Set<string>();
const inflight = new Map<string, Promise<void>>();

function bundleKey(lng: AppLanguage, ns: string): string {
  return `${lng}:${ns}`;
}

function normalizeLanguage(lng: string): AppLanguage {
  return ALLOWED_I18N_LANGUAGES.includes(lng as AppLanguage)
    ? (lng as AppLanguage)
    : 'ru';
}

/** Native: dynamic import fallback when /locales is unavailable. */
const NATIVE_FETCH_FALLBACK: Record<
  AppLanguage,
  Partial<Record<AnyNamespace, () => Promise<{ default?: Record<string, unknown> }>>>
> = {
  en: {
    core: () => import('locales/en/core.json'),
    main: () => import('locales/en/main.json'),
    settings: () => import('locales/en/settings.json'),
    spread: () => import('locales/en/spread.json'),
    characteristics: () => import('locales/en/characteristics.json'),
    subscriptions: () => import('locales/en/subscriptions.json'),
    hello: () => import('locales/en/hello.json'),
    moodAndEnergy: () => import('locales/en/moodAndEnergy.json'),
    habits: () => import('locales/en/habits.json'),
    achievements: () => import('locales/en/achievements.json'),
    affirmations: () => import('locales/en/affirmations.json'),
    card: () => import('locales/en/card.json'),
  },
  ru: {
    card: () => import('locales/ru/card.json'),
    affirmations: () => import('locales/ru/affirmations.json'),
  },
};

async function fetchLocaleJson(
  lng: AppLanguage,
  ns: AnyNamespace
): Promise<Record<string, unknown>> {
  const response = await fetch(`/locales/${lng}/${ns}.json`, {
    cache: 'force-cache',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch /locales/${lng}/${ns}.json (${response.status})`);
  }

  return (await response.json()) as Record<string, unknown>;
}

async function importLocaleJsonNative(
  lng: AppLanguage,
  ns: AnyNamespace
): Promise<Record<string, unknown>> {
  const loader = NATIVE_FETCH_FALLBACK[lng][ns];
  if (!loader) {
    throw new Error(`No native fallback for ${lng}/${ns}`);
  }
  const mod = await loader();
  return (mod.default ?? mod) as Record<string, unknown>;
}

async function loadNamespace(lng: AppLanguage, ns: AnyNamespace): Promise<void> {
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
    let data: Record<string, unknown>;

    if (Platform.OS === 'web') {
      data = await fetchLocaleJson(lng, ns);
    } else {
      try {
        data = await fetchLocaleJson(lng, ns);
      } catch {
        data = await importLocaleJsonNative(lng, ns);
      }
    }

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

/** Fetch all startup namespaces for a language (used when switching to EN). */
export async function loadStartupLanguageBundles(lng: AppLanguage): Promise<void> {
  if (lng === 'ru') {
    return;
  }
  await Promise.all(
    STARTUP_I18N_NAMESPACES.map((ns) => loadNamespace(lng, ns))
  );
}

/** Load namespaces on demand (card, affirmations, or any via fetch). */
export async function ensureI18nNamespaces(
  ...args: [...string[], AppLanguage] | string[]
): Promise<void> {
  let lng = normalizeLanguage(i18next.language || 'ru');
  let namespaces = args as string[];

  const last = namespaces[namespaces.length - 1];
  if (last === 'en' || last === 'ru') {
    lng = last;
    namespaces = namespaces.slice(0, -1);
  }

  await Promise.all(
    namespaces.map((ns) => loadNamespace(lng, ns as AnyNamespace))
  );
}
