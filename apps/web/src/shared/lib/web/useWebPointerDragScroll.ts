import { useEffect } from 'react';
import { Platform } from 'react-native';
import {
  WEB_CARD_MEANINGS_CLASS,
  WEB_SCROLL_Y_CLASS,
  WEB_SCROLL_Y_DRAGGING_CLASS,
} from './webScrollClasses';

const DRAG_THRESHOLD_PX = 4;

function isDragExcluded(target: HTMLElement): boolean {
  return Boolean(
    target.closest(
      'button, a, input, textarea, select, [role="button"], [data-tarot-card-tile]'
    )
  );
}

function resolveScrollContainer(target: HTMLElement): HTMLElement | null {
  if (isDragExcluded(target)) {
    return null;
  }

  if (target.closest(`.${WEB_CARD_MEANINGS_CLASS}`)) {
    return target.closest(`.${WEB_SCROLL_Y_CLASS}`) as HTMLElement | null;
  }

  return target.closest(`.${WEB_SCROLL_Y_CLASS}`) as HTMLElement | null;
}

/**
 * Web: click-drag vertical scroll inside `.tarot-web-scroll-y` (meanings and lists).
 * Touch scrolling uses CSS `touch-action: pan-y` on the same containers.
 */
export function useWebPointerDragScroll(): void {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      return;
    }

    let scrollEl: HTMLElement | null = null;
    let pointerId: number | null = null;
    let startY = 0;
    let startScrollTop = 0;
    let dragging = false;

    const clearDrag = (): void => {
      if (scrollEl) {
        scrollEl.classList.remove(WEB_SCROLL_Y_DRAGGING_CLASS);
        scrollEl.style.removeProperty('user-select');
      }
      scrollEl = null;
      pointerId = null;
      dragging = false;
    };

    const onPointerDown = (event: PointerEvent): void => {
      if (event.pointerType !== 'mouse' || event.button !== 0) {
        return;
      }

      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      const container = resolveScrollContainer(target);
      if (!container) {
        return;
      }

      scrollEl = container;
      pointerId = event.pointerId;
      startY = event.clientY;
      startScrollTop = container.scrollTop;
      dragging = false;

      container.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent): void => {
      if (scrollEl === null || pointerId !== event.pointerId) {
        return;
      }

      const deltaY = event.clientY - startY;
      if (!dragging && Math.abs(deltaY) < DRAG_THRESHOLD_PX) {
        return;
      }

      if (!dragging) {
        dragging = true;
        scrollEl.classList.add(WEB_SCROLL_Y_DRAGGING_CLASS);
        scrollEl.style.userSelect = 'none';
      }

      event.preventDefault();
      scrollEl.scrollTop = startScrollTop - deltaY;
    };

    const onPointerEnd = (event: PointerEvent): void => {
      if (scrollEl === null || pointerId !== event.pointerId) {
        return;
      }

      try {
        scrollEl.releasePointerCapture(event.pointerId);
      } catch {
        // ignore if capture was already released
      }

      clearDrag();
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointermove', onPointerMove, { passive: false });
    document.addEventListener('pointerup', onPointerEnd);
    document.addEventListener('pointercancel', onPointerEnd);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerEnd);
      document.removeEventListener('pointercancel', onPointerEnd);
      clearDrag();
    };
  }, []);
}
