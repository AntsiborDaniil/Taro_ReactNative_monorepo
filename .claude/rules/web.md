---
paths:
  - "apps/web/**"
---

# apps/web — Expo Web фронт

Expo 53 + React Native Web 0.20, React 19, TS strict. Таргет — **только web** (Vercel + Telegram Mini App). Код исторически общий с `apps/native`, поэтому много `Platform.OS === 'web'` веток: native-ветки в web не выполняются, не трать на них время.

## Тяжёлые файлы — НЕ читать целиком

| Файл | Размер | Как работать |
|------|--------|--------------|
| `src/locales/{ru,en}/card.json` | 22 / 12 MB | только `rg '"<cardId>\.meaning' file`, `jq`, `node -e` |
| `src/shared/api/spreadsAndCards/cardsData.ts` | 1.8 MB | `rg -n` по id/имени, потом `Read` с offset/limit |
| `public/locales/**`, `dist/**` | копии | генерируются билдом, не редактировать и не искать в них |
| `assets/` | 48 MB медиа | не читать |

Ключи `card.json`: `<cardId>.meaning.<upright|reversed>.<spreadName>.<positionIndex>` (+ `yesNo.*`). `spreadName` — значения enum `SpreadName` (`thematic_careerFinance` и т.п.).

## Точки входа

- `index.ts` — критические стили, SEO-мета, Яндекс.Метрика, `registerRootComponent`.
- `App.tsx` — дерево провайдеров: SafeArea → UI Kitten `ApplicationProvider` (eva.dark + `myTheme`) → `LoadingsContext` → `NavigationContainer` → `WebUserSessionProvider` → `ApplicationConfigContext` → `GlobalProvider` → `RootNavigator`, плюс `AIAnimation`, `TarotToast`.
- `i18n.ts` — инициализация i18next; язык web берётся из `localStorage.language` (по умолчанию `ru`).
- `metro.config.js` — алиасы native-модулей на заглушки (см. ниже), SVG как компоненты (`react-native-svg-transformer`), `apps/admin` в blockList.

## Слои (Feature-Sliced Design), `src/`

`app` → `pages` → `widgets` → `features` → `entities` → `shared`. Импорт только «вниз». Алиасы: `app/*`, `pages/*`, `widgets/*`, `features/*`, `entities/*`, `shared/*`, `locales/*`, `assets/*` (менять синхронно в `tsconfig.json` и `babel.config.js`). Относительные пути только внутри одного слайса.

Структура слайса: `index.ts` (публичный API, `export * from './ui'`), `ui/`, `model/` (хуки, контекст, типы), `lib/` (чистые хелперы). Снаружи импортировать только из `index.ts` слайса.

- `app/navigation` — навигация. `app/providers` — `GlobalProvider` (favorites, habits, motivation, payment, modals, tabs), `WebA11y`, `WebTypography`.
- `pages/*` — экраны (main, spreads, spreadReadings, detailCard, library, cardsDictionary, settings[+Auth, Language, Sound, DeckStyle], spreadsHistory, favoriteCards, habit*, moodAndEnergy, motivation, dayAdvice, affirmations, legal, goalCelebration, errorBoundary).
- `entities/*` — доменное состояние: `user` (сессия), `ApplicationConfig` (настройки), `Spread` (текущий расклад + AI), `favorites`, `habits`, `moodAndEnergy`, `tarotMotivation`, `affirmations`.
- `features/*` — `tarotAccess` (лимит, кредиты, модалки покупки), `payment` (RevenueCat — на web заглушка), `paidContent`, `carousel`, `cards`, `scheme`, `header`, `HelloScreen`, `MoodDashboard`, `habits`, `splash`, `Question`, `TarotCardReadings`.
- `shared/` — `api`, `ui`, `themes`, `lib`, `lib/web`, `hooks`, `types`, `constants`, `contexts`, `DataProvider`, `stubs`, `icons`, `config/legal`.

## Состояние: Context + хук, без Redux

Паттерн: `useXxx()` возвращает объект состояния → кладётся в `XxxContext` через `<DataProvider Context={XxxContext} value={...}>` (несколько — через `<MultiProvider providers={[...]}>`) → потребитель читает `useData({ Context: XxxContext })` (бросает, если провайдера нет). Примеры: `entities/favorites`, `entities/habits`, `shared/contexts/TabsAndRoutes`.

`UserContext` (`entities/user/model/types.ts`): `isAuthenticated`, `authUser`, `authSessionLoading`, `tarotDaily` (`{used, limit, day}`), `spreadCredits`, `refreshAuthSession`, `refreshSpreadQuota`. Хелперы гостя/ожидания: `shared/lib/web/webAuthGate.ts` (`isWebGuestSession`, `shouldPromptWebSignIn`…). Не показывай логин, пока `authSessionLoading === true`.

Событие `TAROT_AUTH_CHANGED_EVENT` (`shared/lib/tarotAuthEvents.ts`) — на window после логина/логаута; подписчики перезагружают настройки/данные.

## Навигация

React Navigation 7, без URL-linking (кроме deep link на расшаренный расклад — `useSharedReadingDeepLink`, `shared/lib/web/sharedReadingLink.ts`).

- `RootNavigator` (stack) → `TarotTabs` (bottom tabs: `MainTab`, `SpreadsTab`, `LibraryTab`) → в каждом табе свой native-stack: `app/navigation/{main,spreads,library}/*Screen.tsx`.
- Имена роутов — enum `NavigationRoute` / `TabRoute` в `shared/types/navigation.types.ts`.
- Экраны кроме стартового подключаются лениво через `createLazyScreen` в `app/navigation/lazyScreens.tsx` (опция `i18nNamespaces: ['card']` догружает тяжёлые переводы до показа экрана, fallback — `PageSkeleton`).
- Адаптивный таб-бар (`tabs/adaptiveTabLayout.ts`): bottom bar / rail на широких экранах / FAB-навигация на мобильном web.
- Хелперы: `navigateInTab.ts`, `resetTabToRoot.ts`, `navigationRef.ts`, `navReturnStore.ts`.

## API и данные

- Базовый URL: `getTarotAiApiBaseUrl()` (`shared/api/tarotAiBaseUrl.ts`). Пустой `EXPO_PUBLIC_TAROT_API_BASE_URL` или `same-origin` → текущий origin (прод на Vercel). Локально сам выравнивает `localhost`/`127.0.0.1` под страницу.
- Для новых запросов используй `cloudFetch<T>(path, init)` (`shared/api/cloud/cloudFetch.ts`): ставит `credentials: 'include'` и auth-заголовки, возвращает `{ ok: true, data } | { ok: false, status, message, code }` и не бросает. Прямой `fetch` + `authCredentials()` + `authRequestHeaders()` только если нужен нестандартный ответ.
- Авторизация на web — HttpOnly cookie `tarot_session`. На sign-in/up добавляй `authSignHeaders()` (`X-Web-Cookie-Auth: 1`). В dev есть запасной Bearer из `devAccessToken`.
- Эндпоинты, которые использует web: `/api/auth/*` (me, signin, signup, signout, verify-email, resend-verification, profile, password, telegram, oauth/google, dev/quick-login), `/api/spreads`, `/api/favorites`, `/api/settings`, `/api/interpret` (`entities/Spread/model/useSpread.ts`, тело — `getAIRequestBody`), `/api/motivation/*` (`useMotivation`), `/api/payments/lava/checkout`.
- Хранение: для гостя локально (AsyncStorage/localStorage: история раскладов, настройки, язык), после логина — облако; `shared/lib/cloudMigration/migrateLocalToCloud.ts` переносит локальные данные, `shared/lib/cloudSettings/persistSettings.ts` грузит/сохраняет настройки.
- Статические данные колоды и раскладов: `shared/api/spreadsAndCards/{cardsData,spreadsData,types}.ts` (enum'ы `SpreadName`, `SpreadsCategory`, `TarotCard*`).

## Монетизация

Web: дневной лимит бесплатных раскладов (`tarotDaily`) + платные спред-кредиты (Lava.top), UI в `features/tarotAccess` (`DailyTarotLimitModal`, `BuySpreadCreditsModal`, `SpreadCreditsBadge`). RevenueCat (`features/payment`, `react-native-purchases`) на web — заглушка `WEB_PAYMENT_STUB`. `SubscriptionType`/`isPractitioner` — наследие native.

## Telegram Mini App

`shared/lib/web/telegramWebApp.ts`: загружает `telegram-web-app.js`, `isTelegramMiniApp()`, тихий логин по initData → `/api/auth/telegram`. Кнопка «назад» — `useTelegramBackButton`, высота viewport — CSS-переменная `--tarot-app-height` (`lockMobileInputZoom.ts`, `useWebViewportInsets`).

## Заглушки native-модулей

`metro.config.js` подменяет на `src/shared/stubs/*`: expo-haptics, expo-secure-store, expo-navigation-bar, expo-screen-orientation, expo-notifications, appmetrica, react-native-purchases(-ui), onesignal, blur, slider, date-picker, emoji-keyboard, video, walkthrough-tooltip, device-detection, **@shopify/react-native-skia и victory-native** (на web не работают: графики и Skia-эффекты — заглушки). Новую native-зависимость без web-поддержки → добавить stub и алиас. Импорт таких модулей в коде допустим, они просто no-op.

## UI и стили

- `StyleSheet.create` внизу файла; цвета/токены не хардкодить.
- Две темы токенов:
  - **Новая DS** — `shared/themes/ds` (`DS_COLORS`: `ground900…`, `ink50`, `accent400`, `action500`…; без теней, глубина — ступенями фона). Уже используется на главной, в раскладах, MoodDashboard и habitWidget. **Новые и переделываемые экраны — на DS**, импорт явно из `shared/themes/ds`.
  - Старая — `shared/themes` (`COLORS`, `gradientPallets`, `typography`, `myTheme` для UI Kitten).
- Типографика: `shared/ui/Text` (`category`: h1–h5, p1, p2, label; `weight`). Адаптив: брейкпоинты `RESPONSIVE_BREAKPOINTS` (tablet 768 / laptop 1024 / desktop 1440 / wide 1920) и `TYPOGRAPHY_PX_BY_TIER` в `shared/themes/responsive-tokens.ts`; CSS-переменные — в `responsive-tokens.css`. После правки CSS запусти `pnpm --filter web sync:responsive-tokens` (генерирует `responsive-tokens-css-content.ts`, руками не править).
- Размеры: `useWindowDimensions` или `getWindowWidth()` из `shared/lib/responsive` (`horizontalScale`/`verticalScale` — легаси).
- Базовые компоненты — `shared/ui` (Button, Text, ScreenLayout, Skeleton, TarotCard, TileCard, Input, Radio, Tooltip, ModalsProvider, TarotToast…). Экран оборачивается в `ScreenLayout` (safe-area + Telegram insets). Тосты — `react-native-toast-message`. Модалки — `useData({ Context: ModalsContext })` → `showModal(<Jsx/>)` / `closeModal()`.
- Web-хелперы в `shared/lib/web`: `useWebScrollFriendlyPress`, `hoverTransition`, `useWebSwipeBack`, `DeferredMount`, `preloadWebRoutes`.
- SVG импортируются как React-компоненты; иконки — `shared/icons`.

## i18n

- Неймспейсы = файлы в `src/locales/{ru,en}/`. Стартовые (в бандле ru): core, main, settings, spread, characteristics, subscriptions, hello, moodAndEnergy, habits, achievements. Ленивые (fetch с `/locales/...`): `card`, `affirmations` — `shared/lib/i18n/loadNamespaces.ts` (`ensureI18nNamespaces`).
- `useTranslation('<ns>')`, либо ключ `ns:key`. Новые строки — **в обе локали** (ru — основная). Новый неймспейс → добавить в `STARTUP_I18N_NAMESPACES` или `LAZY_I18N_NAMESPACES`, `TranslationResources` и импорты в `i18n.ts`.

## Сборка и проверки

- `pnpm dev:web` (из корня) — http://localhost:8081. Нужен API на :3002 (`pnpm dev:api`, работает без Supabase).
- Проверка: `pnpm --filter web exec tsc --noEmit`. Скрипт `lint` есть, но ESLint в web не установлен и конфига нет — не полагайся на него.
- `pnpm build:web` — `generate-vercel-config` → `generate-legal-html` → `expo export` → `inject-seo-html` → `copy-lazy-locales` → билд админки → `copy-admin-dist`. `vercel.json` генерируется, руками не правится.
- `api/` (корень пакета, JS) — Vercel serverless-функции для `/api/auth/*`. Это не `src`, в tsconfig исключено; общие хелперы в `api/_lib/`. Остальные `/api/*` проксируются на Render.
- SEO/legal: `shared/config/legal`, `scripts/generate-legal-html.mjs`, `public/robots.txt`, `public/sitemap.xml`, `shared/lib/web/seo.ts`.

## Грабли

- React 19: warning'и `element.ref` и responder-события в dev глушатся в `App.tsx`, это не баги.
- `react`/`react-dom` принудительно из `apps/web/node_modules` (metro `extraNodeModules`) и 19.0.0 через pnpm overrides.
- `SubscriptionType`, `customerInfo`, native-ветки в `GlobalProvider`/`App.tsx` не удалять без просьбы: код синхронизируется с `apps/native`.
