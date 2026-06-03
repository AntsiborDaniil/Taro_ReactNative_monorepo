import i18n from 'i18next';
import { Platform } from 'react-native';

const loadedLanguages = new Set<string>();

/**
 * Card meanings (~12–23 MB per locale) are loaded on demand so the main bundle stays smaller.
 */
export async function ensureCardNamespace(language?: string): Promise<void> {
  if (Platform.OS !== 'web') {
    return;
  }

  const lng = (language ?? i18n.language ?? 'ru').split('-')[0];
  if (loadedLanguages.has(lng) || i18n.hasResourceBundle(lng, 'card')) {
    loadedLanguages.add(lng);
    return;
  }

  const mod =
    lng === 'en'
      ? await import('locales/en/card.json')
      : await import('locales/ru/card.json');

  const bundle = (mod as { default?: Record<string, string> }).default ?? mod;
  i18n.addResourceBundle(lng, 'card', bundle, true, true);
  loadedLanguages.add(lng);
}
