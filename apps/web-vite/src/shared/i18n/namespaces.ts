/**
 * Локали — src/locales (скопированы из apps/web). Каждый файл —
 * отдельный lazy-чанк (import.meta.glob), поэтому тяжёлые card.json/
 * affirmations.json грузятся только по требованию.
 */

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
  'together',
] as const;

export const LAZY_I18N_NAMESPACES = ['card', 'affirmations'] as const;

export const ALLOWED_I18N_LANGUAGES = ['ru', 'en'] as const;
export type AppLanguage = (typeof ALLOWED_I18N_LANGUAGES)[number];

type LocaleLoader = () => Promise<{ default: Record<string, unknown> }>;

// Каждый JSON локали становится отдельным lazy-чанком.
const localeGlob = import.meta.glob('../../locales/*/*.json') as Record<
  string,
  LocaleLoader
>;

const localeIndex = new Map<string, LocaleLoader>();
const LOCALE_KEY_RE = /\/locales\/([a-z]{2})\/([\w.-]+)\.json$/;

for (const [path, loader] of Object.entries(localeGlob)) {
  const match = LOCALE_KEY_RE.exec(path);
  if (!match) continue;
  const [, lng, ns] = match;
  localeIndex.set(`${lng}:${ns}`, loader);
}

export function normalizeLanguage(lng: string | null | undefined): AppLanguage {
  if (!lng) return 'ru';
  const base = lng.toLowerCase().split(/[-_]/)[0] ?? '';
  if (base === 'en') return 'en';
  if (base === 'ru') return 'ru';
  return 'ru';
}

/** Язык интерфейса из Telegram `language_code` (только ru/en в приложении). */
export function languageFromTelegramCode(code: string | null | undefined): AppLanguage {
  if (!code) return 'ru';
  const base = code.toLowerCase().split(/[-_]/)[0] ?? '';
  return base === 'ru' ? 'ru' : 'en';
}

export async function loadLocaleNamespace(
  lng: AppLanguage,
  ns: string,
): Promise<Record<string, unknown>> {
  const loader = localeIndex.get(`${lng}:${ns}`);
  if (!loader) {
    throw new Error(`Locale namespace not found: ${lng}/${ns}`);
  }
  const mod = await loader();
  return mod.default ?? (mod as unknown as Record<string, unknown>);
}
