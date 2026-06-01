import { Affirmations } from 'pages/affirmations';
import { CardsDictionary } from 'pages/cardsDictionary';
import { DayAdvice } from 'pages/dayAdvice';
import { DetailCard } from 'pages/detailCard';
import { FavoriteCards } from 'pages/favoriteCards';
import { HabitChoose } from 'pages/habitChoose';
import { HabitCreate } from 'pages/habitCreate';
import { HabitWeek } from 'pages/habitWeek';
import { GoalCelebration } from 'pages/goalCelebration';
import { Library } from 'pages/library';
import { MoodAndEnergyScreen } from 'pages/moodAndEnergy';
import { MotivationScreen } from 'pages/motivation';
import { Auth, DeckStyle, Language, Settings, Sound } from 'pages/settings';
import { SpreadDescriptionChoice } from 'pages/spreadDescriptionChoice';
import { SpreadReadings } from 'pages/spreadReadings';
import { Spreads } from 'pages/spreads';
import { SpreadsHistory } from 'pages/spreadsHistory';
import { createLazyScreen } from 'shared/lib/web/lazyScreen';
import {
  CardsPageSkeleton,
  HistoryListSkeleton,
  PageSkeleton,
} from 'shared/ui/Skeleton';
import { WebView } from 'shared/ui';

const pageFallback = <PageSkeleton />;

export const LazyMoodAndEnergyScreen = createLazyScreen(
  () =>
    import('pages/moodAndEnergy').then((m) => ({
      default: m.MoodAndEnergyScreen,
    })),
  MoodAndEnergyScreen,
  { fallback: pageFallback }
);

export const LazyDayAdvice = createLazyScreen(
  () => import('pages/dayAdvice').then((m) => ({ default: m.DayAdvice })),
  DayAdvice,
  { fallback: pageFallback }
);

export const LazySpreads = createLazyScreen(
  () => import('pages/spreads').then((m) => ({ default: m.Spreads })),
  Spreads,
  { fallback: pageFallback }
);

export const LazyMotivationScreen = createLazyScreen(
  () =>
    import('pages/motivation').then((m) => ({ default: m.MotivationScreen })),
  MotivationScreen,
  { fallback: pageFallback }
);

export const LazyHabitCreate = createLazyScreen(
  () => import('pages/habitCreate').then((m) => ({ default: m.HabitCreate })),
  HabitCreate,
  { fallback: pageFallback }
);

export const LazyHabitChoose = createLazyScreen(
  () => import('pages/habitChoose').then((m) => ({ default: m.HabitChoose })),
  HabitChoose,
  { fallback: pageFallback }
);

export const LazyHabitWeek = createLazyScreen(
  () => import('pages/habitWeek').then((m) => ({ default: m.HabitWeek })),
  HabitWeek,
  { fallback: pageFallback }
);

export const LazyGoalCelebration = createLazyScreen(
  () =>
    import('pages/goalCelebration').then((m) => ({
      default: m.GoalCelebration,
    })),
  GoalCelebration,
  { fallback: pageFallback }
);

export const LazySpreadsHistory = createLazyScreen(
  () =>
    import('pages/spreadsHistory').then((m) => ({ default: m.SpreadsHistory })),
  SpreadsHistory,
  { fallback: <HistoryListSkeleton /> }
);

export const LazyAffirmations = createLazyScreen(
  () => import('pages/affirmations').then((m) => ({ default: m.Affirmations })),
  Affirmations,
  { fallback: pageFallback }
);

export const LazyCardsDictionary = createLazyScreen(
  () =>
    import('pages/cardsDictionary').then((m) => ({ default: m.CardsDictionary })),
  CardsDictionary,
  { fallback: <CardsPageSkeleton withSuitChips /> }
);

export const LazyFavoriteCards = createLazyScreen(
  () =>
    import('pages/favoriteCards').then((m) => ({ default: m.FavoriteCards })),
  FavoriteCards,
  { fallback: <CardsPageSkeleton /> }
);

export const LazySpreadReadings = createLazyScreen(
  () =>
    import('pages/spreadReadings').then((m) => ({ default: m.SpreadReadings })),
  SpreadReadings,
  { fallback: pageFallback }
);

export const LazySpreadDescriptionChoice = createLazyScreen(
  () =>
    import('pages/spreadDescriptionChoice').then((m) => ({
      default: m.SpreadDescriptionChoice,
    })),
  SpreadDescriptionChoice,
  { fallback: pageFallback }
);

export const LazyDetailCard = createLazyScreen(
  () => import('pages/detailCard').then((m) => ({ default: m.DetailCard })),
  DetailCard,
  { fallback: pageFallback }
);

export const LazySettings = createLazyScreen(
  () => import('pages/settings').then((m) => ({ default: m.Settings })),
  Settings,
  { fallback: pageFallback }
);

export const LazyLanguage = createLazyScreen(
  () => import('pages/settings').then((m) => ({ default: m.Language })),
  Language,
  { fallback: pageFallback }
);

export const LazyDeckStyle = createLazyScreen(
  () => import('pages/settings').then((m) => ({ default: m.DeckStyle })),
  DeckStyle,
  { fallback: pageFallback }
);

export const LazySound = createLazyScreen(
  () => import('pages/settings').then((m) => ({ default: m.Sound })),
  Sound,
  { fallback: pageFallback }
);

export const LazyAuth = createLazyScreen(
  () => import('pages/settings').then((m) => ({ default: m.Auth })),
  Auth,
  { fallback: pageFallback }
);

export const LazyWebView = createLazyScreen(
  () => import('shared/ui').then((m) => ({ default: m.WebView })),
  WebView,
  { fallback: pageFallback }
);

export const LazyLibrary = Library;
