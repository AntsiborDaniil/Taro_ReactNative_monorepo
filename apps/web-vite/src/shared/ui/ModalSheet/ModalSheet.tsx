import { useEffect, useRef, type CSSProperties, type ReactElement, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon } from '../Icon';
import styles from './ModalSheet.module.css';

export type ModalSheetProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  /** Макс. ширина листа на ≥768. По умолчанию 480 (DS). */
  maxWidth?: number;
  closeLabel?: string;
};

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * DS-лист модалки: <768 bottom sheet во всю ширину (верхние углы 5vw), ≥768
 * центр max-width 480, скрим ground900 80%. Esc/клик по скриму закрывают,
 * фокус-ловушка + возврат фокуса, блок скролла body.
 */
export function ModalSheet({ open, onClose, children, title, maxWidth = 480, closeLabel = 'Закрыть' }: ModalSheetProps): ReactElement | null {
  const sheetRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const sheet = sheetRef.current;
    const focusable = sheet?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    (focusable && focusable.length > 0 ? focusable[0] : sheet)?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !sheet) {
        return;
      }
      const nodes = sheet.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (nodes.length === 0) {
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);

    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.body.style.overflow = previousOverflow;
      previouslyFocused.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const rootStyle: CSSProperties & Record<'--modal-max-width', string> = {
    '--modal-max-width': `${maxWidth}px`,
  };

  return createPortal(
    <div className={styles.root} style={rootStyle}>
      <div className={styles.backdrop} onClick={onClose} />
      <div
        ref={sheetRef}
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-label={title ?? undefined}
        tabIndex={-1}
      >
        {title ? (
          <div className={styles.header}>
            <h2 className={styles.title}>{title}</h2>
            <button type="button" className={styles.closeButton} onClick={onClose} aria-label={closeLabel}>
              <CloseIcon width={20} height={20} />
            </button>
          </div>
        ) : null}
        <div className={styles.content}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}
