import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18next from 'i18next';
import { Platform } from 'react-native';
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
  loadStartupLanguageBundles,
  STARTUP_I18N_NAMESPACES,
  type AppLanguage,
} from 'shared/lib/i18n/loadNamespaces';
import { initReactI18next } from 'react-i18next';

export interface TranslationResources {
  card: { [key: string]: string };
  spread: { [key: string]: string };
  core: { [key: string]: string };
  main: { [key: string]: string };
  characteristics: { [key: string]: string };
  settings: { [key: string]: string };
  subscriptions: { [key: string]: string };
  hello: { [key: string]: string };
  affirmations: Record<string, unknown>;
  moodAndEnergy: { [key: string]: string };
  habits: { [key: string]: string };
  achievements: { [key: string]: string | Record<string, string> };
}

/** Russian UI strings ship in the main bundle — always available on first paint. */
const RU_RESOURCES = {
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

function readWebLanguageSync(): AppLanguage {
  if (typeof window === 'undefined') {
    return 'ru';
  }
  try {
    const saved = window.localStorage.getItem('language');
    if (saved === 'en' || saved === 'ru') {
      return saved;
    }
  } catch {
    /* ignore */
  }
  return 'ru';
}

const getInitLanguage = async (): Promise<AppLanguage> => {
  if (Platform.OS === 'web') {
    return readWebLanguageSync();
  }

  const languageFromLocalization =
    Localization.getLocales()?.[0]?.languageCode ?? 'ru';

  try {
    const savedLanguage = await AsyncStorage.getItem('language');
    const candidate =
      savedLanguage ||
      (ALLOWED_I18N_LANGUAGES.includes(languageFromLocalization as AppLanguage)
        ? languageFromLocalization
        : 'ru');

    return ALLOWED_I18N_LANGUAGES.includes(candidate as AppLanguage)
      ? (candidate as AppLanguage)
      : 'ru';
  } catch {
    return ALLOWED_I18N_LANGUAGES.includes(languageFromLocalization as AppLanguage)
      ? (languageFromLocalization as AppLanguage)
      : 'ru';
  }
};

const initI18next = async () => {
  const lng = await getInitLanguage();

  await i18next.use(initReactI18next).init({
    lng,
    fallbackLng: 'ru',
    defaultNS: 'core',
    ns: [...STARTUP_I18N_NAMESPACES],
    resources: RU_RESOURCES,
    /** Keys in JSON use dots literally: "dailyCard.title", "nav.tab.main". */
    keySeparator: false,
    nsSeparator: ':',
    interpolation: {
      escapeValue: false,
    },
  });

  if (lng === 'en') {
    await loadStartupLanguageBundles('en');
  }

  return i18next;
};

export const i18nReady = initI18next();

export default i18nReady;
