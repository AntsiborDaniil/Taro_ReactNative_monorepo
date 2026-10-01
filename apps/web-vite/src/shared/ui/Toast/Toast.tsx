import { useEffect, type ReactElement } from 'react';
import { useAppDispatch, useAppSelector } from '@shared/lib/store';
import { CloseIcon } from '../Icon';
import { dismissToast, type ToastItem } from './model/toastsSlice';
import styles from './Toast.module.css';

const TYPE_CLASS: Record<ToastItem['type'], string | undefined> = {
  info: undefined,
  success: styles.success,
  error: styles.error,
};

function ToastRow({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }): ReactElement {
  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(item.id), item.duration);
    return () => window.clearTimeout(timer);
  }, [item.id, item.duration, onDismiss]);

  return (
    <div className={[styles.toast, TYPE_CLASS[item.type]].filter(Boolean).join(' ')} role="status">
      <p className={styles.message}>{item.message}</p>
      <button type="button" className={styles.closeButton} onClick={() => onDismiss(item.id)} aria-label="Закрыть уведомление">
        <CloseIcon width={14} height={14} />
      </button>
    </div>
  );
}

/** Лист тостов DS: ground700 кант ground600, error — кант alarm600, автоскрытие. */
export function Toaster(): ReactElement | null {
  const items = useAppSelector((state) => state.toasts.items);
  const dispatch = useAppDispatch();

  if (items.length === 0) {
    return null;
  }

  return (
    <div className={styles.viewport} aria-live="polite">
      {items.map((item) => (
        <ToastRow key={item.id} item={item} onDismiss={(id) => dispatch(dismissToast(id))} />
      ))}
    </div>
  );
}
