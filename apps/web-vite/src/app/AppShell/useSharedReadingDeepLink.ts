import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { openSavedSpread, useLazyGetSharedSpreadQuery } from '@entities/spread';
import { useAppDispatch } from '@shared/lib/store';
import { useToast } from '@shared/ui';
import { clearIncomingSharedReadingFromUrl, readIncomingSharedReadingId } from '@shared/lib/sharedReadingLink';

/**
 * Перенос apps/web/src/app/navigation/useSharedReadingDeepLink.ts — открывает
 * расшаренную интерпретацию по Telegram startapp `r_<hex>` / `?reading=<uuid>`
 * через публичный
 * GET /api/spreads/shared/:id, без авторизации.
 */
export function useSharedReadingDeepLink(): void {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useTranslation();
  const [fetchShared] = useLazyGetSharedSpreadQuery();
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    const readingId = readIncomingSharedReadingId();
    if (!readingId) return;

    handledRef.current = true;
    clearIncomingSharedReadingFromUrl();

    void (async () => {
      try {
        const shared = await fetchShared(readingId).unwrap();
        if (!shared?.interpretation) {
          toast.error(t('core:ai.copy.shareOpenFailed', { defaultValue: 'Не удалось открыть расклад по ссылке' }));
          return;
        }
        dispatch(openSavedSpread(shared));
        navigate('/reading');
      } catch {
        toast.error(t('core:ai.copy.shareOpenFailed', { defaultValue: 'Не удалось открыть расклад по ссылке' }));
      }
    })();
  }, [dispatch, navigate, toast, t, fetchShared]);
}
