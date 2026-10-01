import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { openSavedSpread, useLazyGetSharedSpreadQuery } from '@entities/spread';
import { useAppDispatch } from '@shared/lib/store';
import { useToast } from '@shared/ui';
import { clearIncomingSharedReadingFromUrl, waitForIncomingSharedReadingId } from '@shared/lib/sharedReadingLink';

/**
 * Перенос apps/web/src/app/navigation/useSharedReadingDeepLink.ts — открывает
 * расшаренную интерпретацию по Telegram startapp `r_<hex>` / `?reading=<uuid>`
 * через публичный
 * GET /api/spreads/shared/:id, без авторизации.
 *
 * Параметр запуска ждём асинхронно (waitForIncomingSharedReadingId): в Mini App
 * он приходит вместе с мостом telegram-web-app.js, то есть позже монтирования
 * AppShell. Сразу ведём на /reading/result — там готовое толкование.
 */
export function useSharedReadingDeepLink(): void {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useTranslation();
  const [fetchShared] = useLazyGetSharedSpreadQuery();
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    void (async () => {
      const readingId = await waitForIncomingSharedReadingId();
      if (!readingId) return;

      clearIncomingSharedReadingFromUrl();

      try {
        const shared = await fetchShared(readingId).unwrap();
        if (!shared?.interpretation) {
          toast.error(t('core:ai.copy.shareOpenFailed', { defaultValue: 'Не удалось открыть расклад по ссылке' }));
          return;
        }
        dispatch(openSavedSpread(shared));
        navigate('/reading/result');
      } catch {
        toast.error(t('core:ai.copy.shareOpenFailed', { defaultValue: 'Не удалось открыть расклад по ссылке' }));
      }
    })();
    // Запуск строго один раз за жизнь SPA: toast/t пересоздаются на каждый рендер.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
