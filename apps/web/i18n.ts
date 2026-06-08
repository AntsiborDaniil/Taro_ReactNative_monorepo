import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18next from 'i18next';
import enAchievements from 'locales/en/achievements.json';
import enCharacteristics from 'locales/en/characteristics.json';
import enCore from 'locales/en/core.json';
import enHabits from 'locales/en/habits.json';
import enHello from 'locales/en/hello.json';
import enMain from 'locales/en/main.json';
import enMoodAndEnergy from 'locales/en/moodAndEnergy.json';
import enSettings from 'locales/en/settings.json';
import enSpread from 'locales/en/spread.json';
import enSubscriptions from 'locales/en/subscriptions.json';
import ruAchievements from 'locales/ru/achievements.json';
import ruCharacteristics from 'locales/ru/characteristics.json';
import ruCore from 'locales/ru/core.json';
import ruHabits from 'locales/ru/habits.json';
import ruHello from 'locales/ru/hello.json';
import ruMain from 'locales/ru/main.json';
import ruMoodAndEnergy from 'locales/ru/moodAndEnergy.json';
import ruSettings from 'locales/ru/settings.json';
import ruSpread from 'locales/ru/spread.json';
import ruSubscriptions from 'locales/ru/subscriptions.json';
import {
  ALLOWED_I18N_LANGUAGES,
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

/** Static startup bundles (~100 KB per language) — reliable in Expo web export. */
const STARTUP_RESOURCES: Record<AppLanguage, Partial<TranslationResources>> = {
  en: {
    core: enCore,
    main: enMain,
    settings: enSettings,
    spread: enSpread,
    characteristics: enCharacteristics,
    subscriptions: enSubscriptions,
    hello: enHello,
    moodAndEnergy: enMoodAndEnergy,
    habits: enHabits,
    achievements: enAchievements,
  },
  ru: {
    core: ruCore,
    main: ruMain,
    settings: ruSettings,
    spread: ruSpread,
    characteristics: ruCharacteristics,
    subscriptions: ruSubscriptions,
    hello: ruHello,
    moodAndEnergy: ruMoodAndEnergy,
    habits: ruHabits,
    achievements: ruAchievements,
  },
};

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
    resources: STARTUP_RESOURCES,
    interpolation: {
      escapeValue: false,
    },
  });

  return i18next;
};

/** Resolves when i18n is initialized with startup translation bundles. */
export const i18nReady = initI18next();

export default i18nReady;
