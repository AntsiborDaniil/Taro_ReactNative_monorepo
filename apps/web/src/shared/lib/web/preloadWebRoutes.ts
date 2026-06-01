import { Platform } from 'react-native';

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
  };

  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(run, { timeout: 2500 });
    return;
  }

  setTimeout(run, 400);
}
