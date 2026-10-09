import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MetrikaGoal, reachMetrikaGoal } from '@shared/lib/metrika';
import {
  clearIncomingSharedReadingFromUrl,
  giftPath,
  pairPath,
  sharedReadingPath,
  waitForIncomingLink,
} from '@shared/lib/sharedReadingLink';

/**
 * Открывает расшаренную интерпретацию по Telegram startapp `r_<hex>` или старому
 * `?reading=<uuid>`: ведёт на страницу `/r/:id` (она сама грузит публичный
 * GET /api/spreads/shared/:id, без авторизации; ошибки показывает у себя).
 *
 * Те же параметры запуска ведут на «Расклад на двоих» (`pair_<hex>` → /pair/:id)
 * и «Карту для друга» (`gift_<hex>` → /gift/:id).
 *
 * Параметр запуска ждём асинхронно (waitForIncomingLink): в Mini App
 * он приходит вместе с мостом telegram-web-app.js, то есть позже монтирования AppShell.
 */
export function useSharedReadingDeepLink(): void {
  const navigate = useNavigate();
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    void (async () => {
      const link = await waitForIncomingLink();
      if (!link) return;

      clearIncomingSharedReadingFromUrl();
      if (link.kind === 'pair') {
        navigate(pairPath(link.id), { replace: true });
        return;
      }
      if (link.kind === 'gift') {
        navigate(giftPath(link.id), { replace: true });
        return;
      }
      reachMetrikaGoal(MetrikaGoal.shareOpen, { readingId: link.id });
      navigate(sharedReadingPath(link.id), { replace: true });
    })();
    // Запуск строго один раз за жизнь SPA.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
