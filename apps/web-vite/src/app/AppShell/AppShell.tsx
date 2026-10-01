import { Suspense, useEffect, useRef, type ReactElement } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuthMeQuery } from '@entities/user/api';
import { ModalRoot, PageSkeleton, SlowConnectionBanner, Toaster } from '@shared/ui';
// Побочный эффект: регистрирует модалки 'buy-credits'/'daily-limit' в реестре ModalSheet до первого рендера ModalRoot.
import '@features/tarotAccess';
// Побочный эффект: регистрирует модалку 'favorite-like-error'.
import '@entities/favorites';
import { tryDevQuickLogin } from '@shared/lib/devQuickLogin';
import { trackMetrikaPaymentSuccessIfNeeded } from '@shared/lib/metrika';
import { useAppSelector } from '@shared/lib/store';
import { lockMobileInputZoom } from '@shared/lib/web/lockMobileInputZoom';
import { initSafeAreaInsetVars } from '@shared/lib/web/safeAreaInsets';
import { isLikelyTelegramMiniApp, tryAuthenticateTelegramMiniApp } from '@shared/lib/web/telegramWebApp';
import { useTelegramBackButton } from '@shared/lib/web/useTelegramBackButton';
import { NavRail } from './NavRail';
import { FabNav } from './FabNav';
import { useSharedReadingDeepLink } from './useSharedReadingDeepLink';
import styles from './AppShell.module.css';

export function AppShell(): ReactElement {
  // Сессия cookie-based (tarot_session): грузим её один раз на верхнем уровне,
  // entities/user/model/userSlice заполняется через extraReducers по authMe.
  const { isError, refetch } = useAuthMeQuery();
  const quickLoginAttempted = useRef(false);
  const telegramAuthAttempted = useRef(false);

  // Метрика: оплата Lava прошла (возврат с ?lava=success или заряды выросли после чекаута).
  const spreadCredits = useAppSelector((state) => state.user.spreadCredits);
  const sessionLoading = useAppSelector((state) => state.user.sessionLoading);
  useEffect(() => {
    if (!sessionLoading) trackMetrikaPaymentSuccessIfNeeded(spreadCredits ?? undefined);
  }, [spreadCredits, sessionLoading]);

  // Открыть расшаренную интерпретацию по ?reading=<uuid>, если пришли по ссылке.
  useSharedReadingDeepLink();
  // Telegram Mini App: системная кнопка «назад» клиента (no-op вне Telegram).
  useTelegramBackButton();

  // --tarot-app-height/зум инпутов — один раз на весь shell (perm., без cleanup:
  // AppShell не размонтируется в течение жизни SPA).
  useEffect(() => {
    lockMobileInputZoom();
    initSafeAreaInsetVars();
  }, []);

  // Dev-only: VITE_DEV_QUICK_LOGIN=1 — авто-вход гостя тестовой сессией (см.
  // .claude/rules/web.md EXPO_PUBLIC_DEV_QUICK_LOGIN, тот же приём для Playwright).
  // Telegram Mini App: тихий логин по initData → /api/auth/telegram (см.
  // shared/lib/web/telegramWebApp.ts) — пробуем раньше dev quick-login, когда
  // бридж Telegram обнаружен.
  useEffect(() => {
    if (!isError) return;

    if (isLikelyTelegramMiniApp() && !telegramAuthAttempted.current) {
      telegramAuthAttempted.current = true;
      void tryAuthenticateTelegramMiniApp().then((result) => {
        if (result.authenticated) {
          void refetch();
        } else if (!quickLoginAttempted.current) {
          quickLoginAttempted.current = true;
          void tryDevQuickLogin().then((ok) => {
            if (ok) void refetch();
          });
        }
      });
      return;
    }

    if (quickLoginAttempted.current) return;
    quickLoginAttempted.current = true;
    void tryDevQuickLogin().then((ok) => {
      if (ok) void refetch();
    });
  }, [isError, refetch]);

  return (
    <div className={styles.shell}>
      <NavRail />
      <SlowConnectionBanner />
      <main className={styles.content}>
        {/* Код страницы грузится лениво — на медленной сети показываем скелет, навигация остаётся. */}
        <Suspense fallback={<PageSkeleton />}>
          <Outlet />
        </Suspense>
      </main>
      <FabNav />
      <ModalRoot />
      <Toaster />
    </div>
  );
}
