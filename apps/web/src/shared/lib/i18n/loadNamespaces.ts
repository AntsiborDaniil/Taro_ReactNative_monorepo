import i18next from 'i18next';

export const ALLOWED_I18N_LANGUAGES = ['en', 'ru'] as const;
export type AppLanguage = (typeof ALLOWED_I18N_LANGUAGES)[number];

/** Bundled at startup — one active language only (~50 KB). */
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

/** Loaded on demand — card.json is ~13–23 MB per language. */
export const LAZY_I18N_NAMESPACES = ['card', 'affirmations'] as const;

type Namespace = (typeof STARTUP_I18N_NAMESPACES)[number] | (typeof LAZY_I18N_NAMESPACES)[number];

type LocaleModule = { default?: Record<string, unknown> } | Record<string, unknown>;

const LOCALE_LOADERS: Record<
  AppLanguage,
  Partial<Record<Namespace, () => Promise<LocaleModule>>>
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
    core: () => import('locales/ru/core.json'),
    main: () => import('locales/ru/main.json'),
    settings: () => import('locales/ru/settings.json'),
    spread: () => import('locales/ru/spread.json'),
    characteristics: () => import('locales/ru/characteristics.json'),
    subscriptions: () => import('locales/ru/subscriptions.json'),
    hello: () => import('locales/ru/hello.json'),
    moodAndEnergy: () => import('locales/ru/moodAndEnergy.json'),
    habits: () => import('locales/ru/habits.json'),
    achievements: () => import('locales/ru/achievements.json'),
    affirmations: () => import('locales/ru/affirmations.json'),
    card: () => import('locales/ru/card.json'),
  },
};

const loadedKeys = new Set<string>();
const inflight = new Map<string, Promise<void>>();

function normalizeLanguage(lng: string): AppLanguage {
  return ALLOWED_I18N_LANGUAGES.includes(lng as AppLanguage)
    ? (lng as AppLanguage)
    : 'en';
}

function bundleKey(lng: AppLanguage, ns: string): string {
  return `${lng}:${ns}`;
}

async function loadNamespace(lng: AppLanguage, ns: Namespace): Promise<void> {
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

  const loader = LOCALE_LOADERS[lng][ns];
  if (!loader) {
    return;
  }

  const promise = (async () => {
    const mod = await loader();
    const data = (mod as { default?: Record<string, unknown> }).default ?? mod;
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

/** Load translation namespaces for a language (dynamic import = separate JS chunk). */
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
    namespaces.map((ns) => loadNamespace(lng, ns as Namespace))
  );
}

export async function loadStartupLanguageBundles(lng: AppLanguage): Promise<void> {
  await ensureI18nNamespaces(...STARTUP_I18N_NAMESPACES, lng);
}

/** Preload heavy card texts during idle time (current language). */
export function preloadCardTranslationsIdle(): void {
  const run = () => {
    void ensureI18nNamespaces('card');
  };

  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(run, { timeout: 12000 });
    return;
  }

  setTimeout(run, 4000);
}
