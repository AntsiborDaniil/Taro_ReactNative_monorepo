import {
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  createContext,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
  type TransitionEvent as ReactTransitionEvent,
} from 'react';
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

/** Совпадает с --ds-dur-block; запас на кадр, если transitionend не придёт. */
const EXIT_MS = 450;

const ModalSheetCloseContext = createContext<(() => void) | null>(null);

/** Закрытие через лист: выходная анимация, затем onClose. Вне ModalSheet — null. */
export function useModalSheetClose(): (() => void) | null {
  return useContext(ModalSheetCloseContext);
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * DS-лист модалки: <768 bottom sheet во всю ширину (верхние углы 5vw), ≥768
 * центр max-width 480, скрим ground900 80%. Esc/клик по скриму закрывают,
 * фокус-ловушка + возврат фокуса, блок скролла body.
 * Лист остаётся смонтированным на время выхода: скрим гаснет, панель
 * уезжает вниз (<768) или сжимается с затуханием (≥768). onClose — после
 * анимации (сразу, если prefers-reduced-motion).
 */
export function ModalSheet({ open, onClose, children, title, maxWidth = 480, closeLabel = 'Закрыть' }: ModalSheetProps): ReactElement | null {
  const sheetRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const [present, setPresent] = useState(open);
  const [active, setActive] = useState(false);
  const presentRef = useRef(present);
  presentRef.current = present;

  const closingRef = useRef(false);
  const exitHandledRef = useRef(false);
  const notifyOnCloseRef = useRef(false);
  const exitTimerRef = useRef<number | null>(null);
  const wasOpenRef = useRef(open);

  const snapshotRef = useRef<{ children: ReactNode; title?: string }>({ children, title });
  if (open) {
    snapshotRef.current = { children, title };
  }

  if (open && !wasOpenRef.current) {
    closingRef.current = false;
    exitHandledRef.current = false;
    notifyOnCloseRef.current = false;
  }
  wasOpenRef.current = open;

  if (open && !present && !closingRef.current && !exitHandledRef.current) {
    setPresent(true);
  }

  const clearExitTimer = useCallback(() => {
    if (exitTimerRef.current != null) {
      window.clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
  }, []);

  const finishExit = useCallback(() => {
    if (exitHandledRef.current) return;
    exitHandledRef.current = true;
    closingRef.current = false;
    clearExitTimer();
    setActive(false);
    setPresent(false);
    if (notifyOnCloseRef.current) {
      notifyOnCloseRef.current = false;
      onCloseRef.current();
    }
  }, [clearExitTimer]);

  const beginClose = useCallback(
    (notifyParent: boolean) => {
      if (!presentRef.current || closingRef.current || exitHandledRef.current) return;
      closingRef.current = true;
      notifyOnCloseRef.current = notifyParent;
      if (prefersReducedMotion()) {
        finishExit();
        return;
      }
      setActive(false);
      clearExitTimer();
      exitTimerRef.current = window.setTimeout(finishExit, EXIT_MS);
    },
    [clearExitTimer, finishExit],
  );

  const requestClose = useCallback(() => {
    beginClose(true);
  }, [beginClose]);

  useLayoutEffect(() => {
    if (open) {
      // Не сбрасывать выход, если клик уже запустил анимацию, а родитель ещё не закрыл.
      if (closingRef.current) return;
      clearExitTimer();
      if (prefersReducedMotion()) {
        setActive(true);
        return;
      }
      const frame = window.requestAnimationFrame(() => {
        if (closingRef.current || exitHandledRef.current) return;
        setActive(true);
      });
      return () => window.cancelAnimationFrame(frame);
    }

    if (!presentRef.current || exitHandledRef.current || closingRef.current) return;
    beginClose(false);
  }, [open, present, beginClose, clearExitTimer]);

  useLayoutEffect(() => {
    if (!present) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const sheet = sheetRef.current;
    const focusable = sheet?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    (focusable && focusable.length > 0 ? focusable[0] : sheet)?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        requestClose();
        return;
      }
      if (event.key !== 'Tab' || !sheet) return;
      const nodes = sheet.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (nodes.length === 0) return;
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
  }, [present, requestClose]);

  const onSheetTransitionEnd = (event: ReactTransitionEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.propertyName !== 'transform') return;
    if (!closingRef.current) return;
    finishExit();
  };

  if (!present) return null;

  const rootStyle: CSSProperties & Record<'--modal-max-width', string> = {
    '--modal-max-width': `${maxWidth}px`,
  };
  const shownTitle = open ? title : snapshotRef.current.title;
  const shownChildren = open ? children : snapshotRef.current.children;

  return createPortal(
    <ModalSheetCloseContext.Provider value={requestClose}>
      <div className={[styles.root, active ? styles.open : ''].filter(Boolean).join(' ')} style={rootStyle}>
        <div className={styles.backdrop} onClick={requestClose} />
        <div
          ref={sheetRef}
          className={styles.sheet}
          role="dialog"
          aria-modal="true"
          aria-label={shownTitle ?? undefined}
          tabIndex={-1}
          onTransitionEnd={onSheetTransitionEnd}
        >
          {shownTitle ? (
            <div className={styles.header}>
              <h2 className={styles.title}>{shownTitle}</h2>
              <button type="button" className={styles.closeButton} onClick={requestClose} aria-label={closeLabel}>
                <CloseIcon width={20} height={20} />
              </button>
            </div>
          ) : null}
          <div className={styles.content}>{shownChildren}</div>
        </div>
      </div>
    </ModalSheetCloseContext.Provider>,
    document.body,
  );
}
