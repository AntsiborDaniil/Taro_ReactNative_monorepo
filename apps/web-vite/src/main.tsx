import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { store } from '@app/store';
import { router } from '@app/router';
import { userApi } from '@entities/user/api';
import { i18nReady } from '@shared/i18n';
import { initTheme } from '@shared/lib/theme';
import { injectYandexMetrika } from '@shared/lib/metrika';
import { PageSkeleton } from '@shared/ui';
import '@shared/api/baseApi';
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/global.css';

/** Снимает #boot-splash из index.html после первого кадра React. */
function dismissBootSplash(): void {
  const el = document.getElementById('boot-splash');
  if (!el) return;

  const remove = () => {
    el.remove();
  };

  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduceMotion) {
    remove();
    return;
  }

  el.classList.add('boot-splash--out');
  el.setAttribute('aria-busy', 'false');
  el.addEventListener('transitionend', remove, { once: true });
  window.setTimeout(remove, 500);
}

// Тему ставим до первого рендера — без вспышки тёмного холста в светлой теме.
initTheme();
injectYandexMetrika();

async function bootstrap() {
  // Моки только в dev и только по флагу: прод-сборка этот импорт выкидывает (DEV === false).
  if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS === '1') {
    const { startMockWorker } = await import('@shared/api/mocks/browser');
    await startMockWorker();
  }

  // Сессия и квота (бейдж зарядов) — стартуем /me сразу, параллельно с загрузкой
  // i18n и чанков, а не после монтирования AppShell. useAuthMeQuery в AppShell
  // подхватит этот же запрос из кэша RTK Query (дубля не будет).
  store.dispatch(userApi.endpoints.authMe.initiate());

  const i18n = await i18nReady;

  createRoot(document.getElementById('root') as HTMLElement).render(
    <StrictMode>
      <Provider store={store}>
        <I18nextProvider i18n={i18n}>
          <Suspense fallback={<PageSkeleton />}>
            <RouterProvider router={router} />
          </Suspense>
        </I18nextProvider>
      </Provider>
    </StrictMode>,
  );

  // Двойной rAF: сначала React красит #root, потом гасим splash — без мигания пустоты.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => dismissBootSplash());
  });
}

void bootstrap();
