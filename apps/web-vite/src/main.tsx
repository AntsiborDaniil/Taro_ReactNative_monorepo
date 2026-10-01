import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { store } from '@app/store';
import { router } from '@app/router';
import { i18nReady } from '@shared/i18n';
import { initTheme } from '@shared/lib/theme';
import { injectYandexMetrika } from '@shared/lib/metrika';
import '@shared/api/baseApi';
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/global.css';

// Тему ставим до первого рендера — без вспышки тёмного холста в светлой теме.
initTheme();
injectYandexMetrika();

async function bootstrap() {
  const i18n = await i18nReady;

  createRoot(document.getElementById('root') as HTMLElement).render(
    <StrictMode>
      <Provider store={store}>
        <I18nextProvider i18n={i18n}>
          <Suspense fallback={null}>
            <RouterProvider router={router} />
          </Suspense>
        </I18nextProvider>
      </Provider>
    </StrictMode>,
  );
}

void bootstrap();
