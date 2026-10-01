import { useCallback } from 'react';
import { useAppDispatch } from '@shared/lib/store';
import { showToast, type ToastType } from './model/toastsSlice';

export type ToastApi = {
  show: (type: ToastType, message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
};

/** Диспатчит тосты в слайс `toasts` (рендерит Toaster в AppShell). */
export function useToast(): ToastApi {
  const dispatch = useAppDispatch();

  const show = useCallback(
    (type: ToastType, message: string, duration?: number) => {
      dispatch(showToast({ type, message, duration }));
    },
    [dispatch],
  );

  return {
    show,
    info: useCallback((message: string, duration?: number) => show('info', message, duration), [show]),
    success: useCallback((message: string, duration?: number) => show('success', message, duration), [show]),
    error: useCallback((message: string, duration?: number) => show('error', message, duration), [show]),
  };
}
