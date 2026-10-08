import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MetrikaGoal, reachMetrikaGoal } from '@shared/lib/metrika';
import {
  clearIncomingSharedReadingFromUrl,
  sharedReadingPath,
  waitForIncomingSharedReadingId,
} from '@shared/lib/sharedReadingLink';

/**
 * Открывает расшаренную интерпретацию по Telegram startapp `r_<hex>` или старому
 * `?reading=<uuid>`: ведёт на страницу `/r/:id` (она сама грузит публичный
 * GET /api/spreads/shared/:id, без авторизации; ошибки показывает у себя).
 *
 * Параметр запуска ждём асинхронно (waitForIncomingSharedReadingId): в Mini App
 * он приходит вместе с мостом telegram-web-app.js, то есть позже монтирования AppShell.
 */
export function useSharedReadingDeepLink(): void {
  const navigate = useNavigate();
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    void (async () => {
      const readingId = await waitForIncomingSharedReadingId();
      if (!readingId) return;

      clearIncomingSharedReadingFromUrl();
      reachMetrikaGoal(MetrikaGoal.shareOpen, { readingId });
      navigate(sharedReadingPath(readingId), { replace: true });
    })();
    // Запуск строго один раз за жизнь SPA.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
