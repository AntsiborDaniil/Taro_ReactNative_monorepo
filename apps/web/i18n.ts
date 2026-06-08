import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18next from 'i18next';
import {
  ALLOWED_I18N_LANGUAGES,
  ensureI18nNamespaces,
  loadStartupLanguageBundles,
  STARTUP_I18N_NAMESPACES,
  type AppLanguage,
} from 'shared/lib/i18n/loadNamespaces';
import { initReactI18next } from 'react-i18next';

export interface TranslationResources {
  card: {
    [key: string]: string;
  };
  spread: {
    [key: string]: string;
  };
  core: {
    [key: string]: string;
  };
  main: {
    [key: string]: string;
  };
  characteristics: {
    [key: string]: string;
  };
  settings: {
    [key: string]: string;
  };
  subscriptions: {
    [key: string]: string;
  };
  hello: {
    [key: string]: string;
  };
  affirmations: Record<string, unknown>;
  moodAndEnergy: {
    [key: string]: string;
  };
  habits: {
    [key: string]: string;
  };
  achievements: {
    [key: string]: string | Record<string, string>;
  };
}

const getInitLanguage = async (): Promise<AppLanguage> => {
  const languageFromLocalization =
    Localization.getLocales()?.[0]?.languageCode ?? 'en';

  try {
    const savedLanguage = await AsyncStorage.getItem('language');

    const candidate =
      savedLanguage ||
      (ALLOWED_I18N_LANGUAGES.includes(languageFromLocalization as AppLanguage)
        ? languageFromLocalization
        : 'en');

    return ALLOWED_I18N_LANGUAGES.includes(candidate as AppLanguage)
      ? (candidate as AppLanguage)
      : 'en';
  } catch {
    return ALLOWED_I18N_LANGUAGES.includes(languageFromLocalization as AppLanguage)
      ? (languageFromLocalization as AppLanguage)
      : 'en';
  }
};

const initI18next = async () => {
  const lng = await getInitLanguage();

  await i18next.use(initReactI18next).init({
    lng,
    fallbackLng: 'ru',
    defaultNS: 'core',
    ns: [...STARTUP_I18N_NAMESPACES],
    resources: {},
    interpolation: {
      escapeValue: false,
    },
  });

  await loadStartupLanguageBundles(lng);

  if (lng !== 'ru') {
    await loadStartupLanguageBundles('ru');
  }

  return i18next;
};

/** Resolves when startup translation bundles for the active language are loaded. */
export const i18nReady = initI18next();

export default i18nReady;
