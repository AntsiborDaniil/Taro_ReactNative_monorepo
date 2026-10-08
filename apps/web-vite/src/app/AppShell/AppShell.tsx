import { Suspense, useEffect, useRef, type ReactElement } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuthMeQuery } from '@entities/user/api';
import { ModalRoot, PageSkeleton, Toaster } from '@shared/ui';
// Побочный эффект: регистрирует модалки 'buy-credits'/'daily-limit' в реестре ModalSheet до первого рендера ModalRoot.
import '@features/tarotAccess';
// Побочный эффект: лист 'share-reading' (картинка для сторис / ссылка).
import '@features/shareReading';
// Побочный эффект: модалка 'add-to-home-screen' (ярлык Mini App на домашний экран).
import '@features/telegramHomeScreen';
// Побочный эффект: регистрирует модалку 'favorite-like-error'.
import '@entities/favorites';
import { isDevQuickLoginEnabled, tryDevQuickLogin } from '@shared/lib/devQuickLogin';
import { setAuthRetryPending } from '@entities/user';
import { syncLanguageFromTelegram } from '@shared/i18n';
import { setHapticsEnabled } from '@shared/lib/haptics';
import { clearQuotaCache, writeQuotaCache } from '@shared/lib/quotaCache';
import { trackMetrikaPaymentSuccessIfNeeded } from '@shared/lib/metrika';
import { useAppDispatch, useAppSelector } from '@shared/lib/store';
import { lockMobileInputZoom } from '@shared/lib/web/lockMobileInputZoom';
import { initSafeAreaInsetVars } from '@shared/lib/web/safeAreaInsets';
import {
  ensureTelegramWebAppScript,
  initTelegramWebAppChrome,
  isLikelyTelegramMiniApp,
  tryAuthenticateTelegramMiniApp,
} from '@shared/lib/web/telegramWebApp';
import { useTelegramBackButton } from '@shared/lib/web/useTelegramBackButton';
import { useSyncTodayCheckins } from '@features/habits';
import { NavRail } from './NavRail';
import { BottomTabBar } from './BottomTabBar';
import { useSharedReadingDeepLink } from './useSharedReadingDeepLink';
import styles from './AppShell.module.css';

/** SPA не сбрасывает window.scroll при смене роута — без этого новая страница открывается «с середины». */
function useScrollToTopOnNavigate(): void {
  const { pathname, search } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, search]);
}

export function AppShell(): ReactElement {
  useScrollToTopOnNavigate();
  // Сессия cookie-based (tarot_session): грузим её один раз на верхнем уровне,
  // entities/user/model/userSlice заполняется через extraReducers по authMe.
  // refetchOnReconnect: после обрыва сети бейдж зарядов снова подтянет /me.
  const { isError, refetch } = useAuthMeQuery(undefined, {
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  const dispatch = useAppDispatch();
  const quickLoginAttempted = useRef(false);
  const telegramAuthAttempted = useRef(false);

  // Метрика: оплата Lava прошла (возврат с ?lava=success или заряды выросли после чекаута).
  const spreadCredits = useAppSelector((state) => state.user.spreadCredits);
  const sessionLoading = useAppSelector((state) => state.user.sessionLoading);
  const isAuthenticated = useAppSelector((state) => state.user.isAuthenticated);
  useEffect(() => {
    if (!sessionLoading) trackMetrikaPaymentSuccessIfNeeded(spreadCredits ?? undefined);
  }, [spreadCredits, sessionLoading]);

  // Кэш квоты для бейджа зарядов (CreditsBadge рисует его, пока /me летит):
  // пишем на любой странице, а не только там, где бейдж смонтирован.
  const tarotDaily = useAppSelector((state) => state.user.tarotDaily);
  const authRetryPending = useAppSelector((state) => state.user.authRetryPending);
  useEffect(() => {
    if (isAuthenticated && tarotDaily) {
      writeQuotaCache({ tarotDaily, spreadCredits: spreadCredits ?? 0 });
    } else if (!isAuthenticated && !sessionLoading && !authRetryPending) {
      clearQuotaCache();
    }
  }, [isAuthenticated, sessionLoading, authRetryPending, tarotDaily, spreadCredits]);

  // Выключатель «Вибрация» из настроек → модуль haptics (он вне React/Redux).
  const vibrationOn = useAppSelector((state) => state.settings.settings.sound?.vibration ?? true);
  useEffect(() => {
    setHapticsEnabled(vibrationOn);
  }, [vibrationOn]);

  // Открыть расшаренную интерпретацию по ?reading=<uuid>, если пришли по ссылке.
  useSharedReadingDeepLink();
  // Telegram Mini App: системная кнопка «назад» клиента (no-op вне Telegram).
  useTelegramBackButton();
  // Цели: отметки «за сегодня», сделанные до входа/без сети, — на сервер (награда недели).
  useSyncTodayCheckins();

  // --tarot-app-height/зум инпутов — один раз на весь shell (perm., без cleanup:
  // AppShell не размонтируется в течение жизни SPA).
  useEffect(() => {
    lockMobileInputZoom();
    initSafeAreaInsetVars();
  }, []);

  // Mini App: язык = ?lang= от бота → language_code Telegram (пока пользователь
  // сам не выбрал язык в настройках). Script в index.html с defer — после ready
  // initDataUnsafe.user уже доступен.
  // Здесь же — initTelegramWebAppChrome(): expand + disableVerticalSwipes нужны
  // как можно раньше, до первого скролла (иначе свайп сворачивает приложение).
  useEffect(() => {
    if (!isLikelyTelegramMiniApp()) return;
    void ensureTelegramWebAppScript()
      .then(() => {
        initTelegramWebAppChrome();
        syncLanguageFromTelegram();
      })
      .catch(() => undefined);
  }, []);

  // Dev-only: VITE_DEV_QUICK_LOGIN=1 — авто-вход гостя тестовой сессией (см.
  // .claude/rules/web.md EXPO_PUBLIC_DEV_QUICK_LOGIN, тот же приём для Playwright).
  // Telegram Mini App: тихий логин по initData → /api/auth/telegram (см.
  // shared/lib/web/telegramWebApp.ts) — пробуем раньше dev quick-login, когда
  // бридж Telegram обнаружен.
  // Бейдж зарядов: заранее помечаем, что за 401 последует тихий вход — иначе в
  // окне «401 → initData-логин» бейдж на долю секунды пропадал как у гостя.
  useEffect(() => {
    if (isLikelyTelegramMiniApp() || isDevQuickLoginEnabled()) {
      dispatch(setAuthRetryPending(true));
    }
  }, [dispatch]);

  useEffect(() => {
    // Сеть/5xx на /me не должны запускать повторный telegram/dev login, если сессия уже есть.
    if (!isError || isAuthenticated) return;
    const settle = (ok: boolean) => {
      if (ok) void refetch();
      else dispatch(setAuthRetryPending(false));
    };

    if (isLikelyTelegramMiniApp() && !telegramAuthAttempted.current) {
      telegramAuthAttempted.current = true;
      void tryAuthenticateTelegramMiniApp().then((result) => {
        if (result.authenticated) {
          void refetch();
        } else if (!quickLoginAttempted.current) {
          quickLoginAttempted.current = true;
          void tryDevQuickLogin().then(settle);
        } else {
          settle(false);
        }
      });
      return;
    }

    if (quickLoginAttempted.current) return;
    quickLoginAttempted.current = true;
    void tryDevQuickLogin().then(settle);
  }, [dispatch, isError, isAuthenticated, refetch]);

  const { pathname } = useLocation();
  // Карусель выбора карт: таббар прячем с анимацией, чтобы не перекрывал CTA.
  // Расшаренный расклад (/r/:id) — витрина для друга без функциональности: без навигации вообще.
  const isSharedReading = pathname.startsWith('/r/');
  const hideBottomNav = pathname === '/reading' || pathname.startsWith('/reading/') || isSharedReading;

  return (
    <div className={styles.shell}>
      {isSharedReading ? null : <NavRail />}
      <main
        className={
          hideBottomNav ? `${styles.content} ${styles.contentNavHidden}` : styles.content
        }
      >
        {/* Код страницы грузится лениво — на медленной сети показываем скелет, навигация остаётся. */}
        <Suspense fallback={<PageSkeleton />}>
          <Outlet />
        </Suspense>
      </main>
      <BottomTabBar hidden={hideBottomNav} />
      <ModalRoot />
      <Toaster />
    </div>
  );
}
