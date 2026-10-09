import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from './AppShell/AppShell';
// Прямой (не lazy) импорт: errorElement должен ловить и ошибки самой
// загрузки чанков lazy-страниц, поэтому не может сам быть чанком.
import ErrorBoundaryPage from '@pages/errorBoundary/ui/ErrorBoundary';

const HomePage = lazy(() => import('@pages/home'));
const SpreadsPage = lazy(() => import('@pages/spreads'));
const SpreadDetailPage = lazy(() => import('@pages/spreadDetail'));
const ReadingPage = lazy(() => import('@pages/reading'));
const ReadingResultPage = lazy(() => import('@pages/readingResult'));
const SharedReadingPage = lazy(() => import('@pages/sharedReading'));
const PairPage = lazy(() => import('@pages/pair'));
const GiftPage = lazy(() => import('@pages/gift'));
const CardDetailPage = lazy(() => import('@pages/cardDetail'));
const HistoryPage = lazy(() => import('@pages/history'));
const MirrorPage = lazy(() => import('@pages/mirror'));
const LibraryPage = lazy(() => import('@pages/library'));
const DictionaryPage = lazy(() => import('@pages/dictionary'));
const FavoritesPage = lazy(() => import('@pages/favorites'));
const AffirmationsPage = lazy(() => import('@pages/affirmations'));
const HabitsPage = lazy(() => import('@pages/habits'));
const HabitNewPage = lazy(() => import('@pages/habitNew'));
const HabitWeekPage = lazy(() => import('@pages/habitWeek'));
const MoodPage = lazy(() => import('@pages/mood'));
const MotivationPage = lazy(() => import('@pages/motivation'));
const DayAdvicePage = lazy(() => import('@pages/dayAdvice'));
const GoalPage = lazy(() => import('@pages/goal'));
const SettingsPage = lazy(() => import('@pages/settings'));
const SettingsAccountPage = lazy(() => import('@pages/settingsAccount'));
const SettingsLanguagePage = lazy(() => import('@pages/settingsLanguage'));
const SettingsDeckPage = lazy(() => import('@pages/settingsDeck'));
const SettingsSoundPage = lazy(() => import('@pages/settingsSound'));
const LegalPage = lazy(() => import('@pages/legal'));
const LegalDocPage = lazy(() => import('@pages/legalDoc'));
const NotFoundPage = lazy(() => import('@pages/notFound'));
const DevUiPage = lazy(() => import('@pages/devUi'));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    errorElement: <ErrorBoundaryPage />,
    children: [
      { index: true, Component: HomePage },
      // Витрина UI-кита — только в dev-сборке.
      ...(import.meta.env.DEV ? [{ path: 'dev/ui', Component: DevUiPage }] : []),
      { path: 'spreads', Component: SpreadsPage },
      { path: 'spreads/:spreadId', Component: SpreadDetailPage },
      { path: 'reading', Component: ReadingPage },
      { path: 'reading/result', Component: ReadingResultPage },
      { path: 'r/:id', Component: SharedReadingPage },
      // «Вместе»: пара и карта для друга (ссылки открываются и гостем).
      { path: 'pair/:id', Component: PairPage },
      { path: 'gift/:id', Component: GiftPage },
      { path: 'card/:cardId', Component: CardDetailPage },
      { path: 'history', Component: HistoryPage },
      { path: 'mirror', Component: MirrorPage },
      { path: 'library', Component: LibraryPage },
      { path: 'dictionary', Component: DictionaryPage },
      { path: 'favorites', Component: FavoritesPage },
      { path: 'affirmations', Component: AffirmationsPage },
      { path: 'habits', Component: HabitsPage },
      { path: 'habits/new', Component: HabitNewPage },
      { path: 'habits/week', Component: HabitWeekPage },
      { path: 'mood', Component: MoodPage },
      { path: 'motivation', Component: MotivationPage },
      { path: 'day-advice', Component: DayAdvicePage },
      { path: 'goal', Component: GoalPage },
      { path: 'settings', Component: SettingsPage },
      { path: 'settings/account', Component: SettingsAccountPage },
      { path: 'settings/language', Component: SettingsLanguagePage },
      { path: 'settings/deck', Component: SettingsDeckPage },
      { path: 'settings/sound', Component: SettingsSoundPage },
      { path: 'documents', Component: LegalPage },
      { path: 'documents/:docId', Component: LegalDocPage },
      { path: '*', Component: NotFoundPage },
    ],
  },
]);
