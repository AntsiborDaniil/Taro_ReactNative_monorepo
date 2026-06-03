import { Platform } from 'react-native';

/** Подгружает частые чанки после первого кадра — меньше пауз при навигации. */
export function preloadWebRoutes(): void {
  if (Platform.OS !== 'web') {
    return;
  }

  const run = () => {
    void import('pages/settings');
    void import('shared/lib/i18n/loadCardNamespace').then((m) =>
      m.ensureCardNamespace()
    );
  };

  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(run, { timeout: 2500 });
    return;
  }

  setTimeout(run, 400);
}
