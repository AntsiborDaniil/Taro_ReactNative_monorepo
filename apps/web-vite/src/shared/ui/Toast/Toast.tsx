import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
  type TouchEvent as ReactTouchEvent,
  type TransitionEvent as ReactTransitionEvent,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@shared/lib/store';
import { CloseIcon } from '../Icon';
import { dismissToast, type ToastItem } from './model/toastsSlice';
import styles from './Toast.module.css';

const TYPE_CLASS: Record<ToastItem['type'], string | undefined> = {
  info: undefined,
  success: styles.success,
  error: styles.error,
};

/** Совпадает с --ds-dur-block; запас, если transitionend не придёт. */
const EXIT_MS = 450;
const SWIPE_DISMISS_PX = 48;

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function ToastRow({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }): ReactElement {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<'enter' | 'shown' | 'leave'>('enter');
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef(0);
  const startYRef = useRef(0);
  const leaveRequestedRef = useRef(false);
  const dismissedRef = useRef(false);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  const dismissNow = useCallback(() => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    onDismissRef.current(item.id);
  }, [item.id]);

  const requestLeave = useCallback(() => {
    if (leaveRequestedRef.current) return;
    leaveRequestedRef.current = true;
    setDragging(false);
    if (prefersReducedMotion()) {
      dismissNow();
      return;
    }
    setPhase('leave');
  }, [dismissNow]);

  useLayoutEffect(() => {
    if (prefersReducedMotion()) {
      setPhase('shown');
      return;
    }
    const frame = window.requestAnimationFrame(() => setPhase('shown'));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (phase !== 'shown') return;
    const timer = window.setTimeout(requestLeave, item.duration);
    return () => window.clearTimeout(timer);
  }, [phase, item.duration, requestLeave]);

  useEffect(() => {
    if (phase !== 'leave') return;
    const timeout = window.setTimeout(dismissNow, EXIT_MS);
    return () => window.clearTimeout(timeout);
  }, [phase, dismissNow]);

  const onTransitionEnd = (event: ReactTransitionEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (phase !== 'leave') return;
    if (event.propertyName !== 'transform' && event.propertyName !== 'opacity') return;
    dismissNow();
  };

  const onTouchStart = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (leaveRequestedRef.current) return;
    startYRef.current = event.touches[0]?.clientY ?? 0;
    setDragging(true);
  };

  const onTouchMove = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (!dragging || leaveRequestedRef.current) return;
    const currentY = event.touches[0]?.clientY ?? startYRef.current;
    const next = Math.min(0, currentY - startYRef.current);
    dragRef.current = next;
    setDrag(next);
  };

  const onTouchEnd = () => {
    if (!dragging) return;
    setDragging(false);
    if (dragRef.current <= -SWIPE_DISMISS_PX) {
      requestLeave();
      return;
    }
    dragRef.current = 0;
    setDrag(0);
  };

  const phaseClass = phase === 'shown' ? styles.shown : phase === 'leave' ? styles.leave : '';

  return (
    <div
      className={[styles.toast, TYPE_CLASS[item.type], phaseClass, dragging ? styles.dragging : ''].filter(Boolean).join(' ')}
      style={{ '--toast-shift': `${drag}px` } as CSSProperties}
      role="status"
      onTransitionEnd={onTransitionEnd}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      <p className={styles.message}>{item.message}</p>
      <button type="button" className={styles.closeButton} onClick={requestLeave} aria-label={t('core:a11y.dismissToast')}>
        <CloseIcon width={14} height={14} />
      </button>
    </div>
  );
}

/** Лист тостов DS: сверху, появление/уход, свайп вверх закрывает, автоскрытие. */
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
