import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18next from 'i18next';
import enAffirmations from 'locales/en/affirmations.json';
import enAchievements from 'locales/en/achievements.json';
import enCards from 'locales/en/card.json';
import enCharacteristics from 'locales/en/characteristics.json';
import enCore from 'locales/en/core.json';
import enHabits from 'locales/en/habits.json';
import enHello from 'locales/en/hello.json';
import enMain from 'locales/en/main.json';
import enMoodAndEnergy from 'locales/en/moodAndEnergy.json';
import enSettings from 'locales/en/settings.json';
import enSpread from 'locales/en/spread.json';
import enSubscriptions from 'locales/en/subscriptions.json';
import ruAffirmations from 'locales/ru/affirmations.json';
import ruAchievements from 'locales/ru/achievements.json';
import ruCards from 'locales/ru/card.json';
import ruCharacteristics from 'locales/ru/characteristics.json';
import ruCore from 'locales/ru/core.json';
import ruHabits from 'locales/ru/habits.json';
import ruHello from 'locales/ru/hello.json';
import ruMain from 'locales/ru/main.json';
import ruMoodAndEnergy from 'locales/ru/moodAndEnergy.json';
import ruSettings from 'locales/ru/settings.json';
import ruSpread from 'locales/ru/spread.json';
import ruSubscriptions from 'locales/ru/subscriptions.json';
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
  /** Includes nested objects (e.g. affirmationsItems) — not only strings */
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

const resources: Record<string, Partial<TranslationResources>> = {
  en: {
    card: enCards,
    subscriptions: enSubscriptions,
    spread: enSpread,
    core: enCore,
    main: enMain,
    characteristics: enCharacteristics,
    settings: enSettings,
    hello: enHello,
    affirmations: enAffirmations,
    moodAndEnergy: enMoodAndEnergy,
    habits: enHabits,
    achievements: enAchievements,
  },
  ru: {
    card: ruCards,
    subscriptions: ruSubscriptions,
    spread: ruSpread,
    core: ruCore,
    main: ruMain,
    characteristics: ruCharacteristics,
    settings: ruSettings,
    hello: ruHello,
    affirmations: ruAffirmations,
    moodAndEnergy: ruMoodAndEnergy,
    habits: ruHabits,
    achievements: ruAchievements,
  },
};

const allowedLanguages = ['en', 'ru'];

const getInitLanguage = async () => {
  const languageFromLocalization =
    Localization.getLocales()?.[0]?.languageCode ?? 'en';

  try {
    const savedLanguage = await AsyncStorage.getItem('language');

    return (
      savedLanguage ||
      (allowedLanguages.includes(languageFromLocalization)
        ? languageFromLocalization
        : 'en')
    );
  } catch {
    return allowedLanguages.includes(languageFromLocalization)
      ? languageFromLocalization
      : 'en';
  }
};

// Асинхронная инициализация i18next
const initI18next = async () => {
  const lng = await getInitLanguage();

  return await i18next.use(initReactI18next).init({
    resources,
    lng,
    fallbackLng: 'ru',
    ns: ['card'],
    defaultNS: 'card',
    interpolation: {
      escapeValue: false,
    },
  });
};

export default initI18next();
