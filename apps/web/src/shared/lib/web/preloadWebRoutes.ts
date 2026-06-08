import { Platform } from 'react-native';
import { preloadCardTranslationsIdle } from 'shared/lib/i18n/loadNamespaces';

/** Подгружает частые чанки после первого кадра — меньше пауз при навигации. */
export function preloadWebRoutes(): void {
  if (Platform.OS !== 'web') {
    return;
  }

  const run = () => {
    void import('pages/spreads');
    void import('pages/cardsDictionary');
    void import('pages/favoriteCards');
    void import('pages/spreadsHistory');
    void import('pages/affirmations');
    void import('pages/settings');
    preloadCardTranslationsIdle();
  };

  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(run, { timeout: 8000 });
    return;
  }

  setTimeout(run, 3000);
}
