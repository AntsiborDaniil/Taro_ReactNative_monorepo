import { createLazyScreen } from 'shared/lib/web/lazyScreen';
import {
  CardsPageSkeleton,
  HistoryListSkeleton,
  PageSkeleton,
} from 'shared/ui/Skeleton';

const pageFallback = <PageSkeleton />;

export const LazyMoodAndEnergyScreen = createLazyScreen(
  () =>
    import('pages/moodAndEnergy').then((m) => ({
      default: m.MoodAndEnergyScreen,
    })),
  { fallback: pageFallback }
);

export const LazyDayAdvice = createLazyScreen(
  () => import('pages/dayAdvice').then((m) => ({ default: m.DayAdvice })),
  { fallback: pageFallback }
);

export const LazySpreads = createLazyScreen(
  () => import('pages/spreads').then((m) => ({ default: m.Spreads })),
  { fallback: pageFallback }
);

export const LazyMotivationScreen = createLazyScreen(
  () =>
    import('pages/motivation').then((m) => ({ default: m.MotivationScreen })),
  { fallback: pageFallback }
);

export const LazyHabitCreate = createLazyScreen(
  () => import('pages/habitCreate').then((m) => ({ default: m.HabitCreate })),
  { fallback: pageFallback }
);

export const LazyHabitChoose = createLazyScreen(
  () => import('pages/habitChoose').then((m) => ({ default: m.HabitChoose })),
  { fallback: pageFallback }
);

export const LazyHabitWeek = createLazyScreen(
  () => import('pages/habitWeek').then((m) => ({ default: m.HabitWeek })),
  { fallback: pageFallback }
);

export const LazyGoalCelebration = createLazyScreen(
  () =>
    import('pages/goalCelebration').then((m) => ({
      default: m.GoalCelebration,
    })),
  { fallback: pageFallback }
);

export const LazySpreadsHistory = createLazyScreen(
  () =>
    import('pages/spreadsHistory').then((m) => ({ default: m.SpreadsHistory })),
  { fallback: <HistoryListSkeleton /> }
);

export const LazyAffirmations = createLazyScreen(
  () => import('pages/affirmations').then((m) => ({ default: m.Affirmations })),
  { fallback: pageFallback }
);

export const LazyCardsDictionary = createLazyScreen(
  () =>
    import('pages/cardsDictionary').then((m) => ({ default: m.CardsDictionary })),
  { fallback: <CardsPageSkeleton withSuitChips /> }
);

export const LazyFavoriteCards = createLazyScreen(
  () =>
    import('pages/favoriteCards').then((m) => ({ default: m.FavoriteCards })),
  { fallback: <CardsPageSkeleton /> }
);

export const LazySpreadReadings = createLazyScreen(
  () =>
    import('pages/spreadReadings').then((m) => ({ default: m.SpreadReadings })),
  { fallback: pageFallback }
);

export const LazySpreadDescriptionChoice = createLazyScreen(
  () =>
    import('pages/spreadDescriptionChoice').then((m) => ({
      default: m.SpreadDescriptionChoice,
    })),
  { fallback: pageFallback }
);

export const LazyDetailCard = createLazyScreen(
  () => import('pages/detailCard').then((m) => ({ default: m.DetailCard })),
  { fallback: pageFallback }
);

export const LazySettings = createLazyScreen(
  () => import('pages/settings').then((m) => ({ default: m.Settings })),
  { fallback: pageFallback }
);

export const LazyLanguage = createLazyScreen(
  () => import('pages/settings').then((m) => ({ default: m.Language })),
  { fallback: pageFallback }
);

export const LazyDeckStyle = createLazyScreen(
  () => import('pages/settings').then((m) => ({ default: m.DeckStyle })),
  { fallback: pageFallback }
);

export const LazySound = createLazyScreen(
  () => import('pages/settings').then((m) => ({ default: m.Sound })),
  { fallback: pageFallback }
);

export const LazyAuth = createLazyScreen(
  () => import('pages/settings').then((m) => ({ default: m.Auth })),
  { fallback: pageFallback }
);

export const LazyWebView = createLazyScreen(
  () => import('shared/ui').then((m) => ({ default: m.WebView })),
  { fallback: pageFallback }
);

export const LazyLibrary = createLazyScreen(
  () => import('pages/library').then((m) => ({ default: m.Library })),
  { fallback: pageFallback }
);
