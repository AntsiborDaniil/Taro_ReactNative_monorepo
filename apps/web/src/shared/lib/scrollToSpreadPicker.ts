import { Platform, type View } from 'react-native';
import { isTelegramMiniApp } from 'shared/lib/web/telegramWebApp';

export const SPREAD_PICKER_SLIDER_ID = 'tarot-spread-picker-slider';

type ScrollRef = {
  getScrollResponder?: () => unknown;
  scrollToPosition?: (x: number, y: number, animated?: boolean) => void;
} | null;

const SCROLL_DURATION_MS = 920;

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function resolveHTMLElement(ref: View | null, targetId?: string): HTMLElement | null {
  if (typeof document !== 'undefined' && targetId) {
    const byId = document.getElementById(targetId);
    if (byId) {
      return byId;
    }
  }

  if (!ref) {
    return null;
  }

  const node = ref as unknown as HTMLElement;
  if (typeof node.getBoundingClientRect === 'function') {
    return node;
  }

  return null;
}

function resolveScrollContainer(scrollRef?: ScrollRef): HTMLElement | null {
  const responder = scrollRef?.getScrollResponder?.() as
    | { getScrollableNode?: () => HTMLElement }
    | HTMLElement
    | undefined;

  if (!responder) {
    return null;
  }

  if (
    typeof (responder as { getScrollableNode?: () => HTMLElement }).getScrollableNode ===
    'function'
  ) {
    return (responder as { getScrollableNode: () => HTMLElement }).getScrollableNode();
  }

  if (typeof (responder as HTMLElement).scrollTo === 'function') {
    return responder as HTMLElement;
  }

  return null;
}

function findScrollableParent(element: HTMLElement): HTMLElement | null {
  let node: HTMLElement | null = element.parentElement;

  while (node) {
    const style = window.getComputedStyle(node);
    const canScrollY =
      (style.overflowY === 'auto' ||
        style.overflowY === 'scroll' ||
        style.overflowY === 'overlay') &&
      node.scrollHeight > node.clientHeight + 1;

    if (canScrollY) {
      return node;
    }

    node = node.parentElement;
  }

  return null;
}

function animateScrollTop(
  scrollContainer: HTMLElement,
  targetTop: number,
  durationMs = SCROLL_DURATION_MS
): void {
  const start = scrollContainer.scrollTop;
  const delta = targetTop - start;

  if (Math.abs(delta) < 6) {
    return;
  }

  const startTime = performance.now();

  const tick = (now: number) => {
    const progress = Math.min(1, (now - startTime) / durationMs);
    scrollContainer.scrollTop = start + delta * easeInOutCubic(progress);

    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  };

  requestAnimationFrame(tick);
}

function animateWindowScrollTo(
  targetTop: number,
  durationMs = SCROLL_DURATION_MS
): void {
  const start = window.scrollY || document.documentElement.scrollTop;
  const delta = targetTop - start;

  if (Math.abs(delta) < 6) {
    return;
  }

  const startTime = performance.now();

  const tick = (now: number) => {
    const progress = Math.min(1, (now - startTime) / durationMs);
    const nextTop = start + delta * easeInOutCubic(progress);
    window.scrollTo(0, nextTop);

    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  };

  requestAnimationFrame(tick);
}

function scrollElementToTarget(
  scrollContainer: HTMLElement,
  target: HTMLElement,
  topOffset: number
): void {
  const containerRect = scrollContainer.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const nextTop =
    scrollContainer.scrollTop + (targetRect.top - containerRect.top) - topOffset;

  animateScrollTop(scrollContainer, Math.max(0, nextTop));
}

function scrollWindowToTarget(target: HTMLElement, topOffset: number): void {
  const rect = target.getBoundingClientRect();
  const absoluteTop = rect.top + (window.scrollY || document.documentElement.scrollTop);
  animateWindowScrollTo(Math.max(0, absoluteTop - topOffset));
}

function getTopOffset(): number {
  if (isTelegramMiniApp()) {
    return 96;
  }

  return 72;
}

/** Smoothly bring the card picker (altar / carousel) into view. */
export function scrollToSpreadPicker(
  targetRef: View | null,
  scrollRef?: ScrollRef,
  targetId: string = SPREAD_PICKER_SLIDER_ID
): void {
  const topOffset = getTopOffset();

  const scrollViaMeasure = (): boolean => {
    if (!targetRef) {
      return false;
    }

    const scrollResponder = scrollRef?.getScrollResponder?.();
    if (!scrollResponder || typeof targetRef.measureLayout !== 'function') {
      return false;
    }

    const scrollNode = scrollResponder as unknown as View;
    targetRef.measureLayout(
      scrollNode,
      (_x, y) => {
        scrollRef?.scrollToPosition?.(0, Math.max(0, y - topOffset), true);
      },
      () => {
        /* ignore measure errors */
      }
    );
    return true;
  };

  if (Platform.OS === 'web') {
    const runWebScroll = () => {
      const target = resolveHTMLElement(targetRef, targetId);
      if (!target) {
        scrollViaMeasure();
        return;
      }

      const kasvContainer = resolveScrollContainer(scrollRef);
      if (kasvContainer) {
        scrollElementToTarget(kasvContainer, target, topOffset);
        return;
      }

      const scrollParent = findScrollableParent(target);
      if (scrollParent) {
        scrollElementToTarget(scrollParent, target, topOffset);
        return;
      }

      const docScrollable = document.scrollingElement;
      if (
        docScrollable &&
        docScrollable.scrollHeight > docScrollable.clientHeight + 1
      ) {
        scrollElementToTarget(docScrollable, target, topOffset);
        return;
      }

      scrollWindowToTarget(target, topOffset);

      if (!scrollViaMeasure()) {
        target.scrollIntoView?.({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest',
        });
      }
    };

    requestAnimationFrame(() => {
      runWebScroll();
    });
    return;
  }

  scrollViaMeasure();
}

/** Retry scroll while layout settles (Telegram Mini App / web). */
export function scrollToSpreadPickerWithRetries(
  targetRef: View | null,
  scrollRef?: ScrollRef,
  delaysMs: number[] = [0, 180, 420, 720, 1100],
  targetId: string = SPREAD_PICKER_SLIDER_ID
): void {
  delaysMs.forEach((delay) => {
    if (delay === 0) {
      scrollToSpreadPicker(targetRef, scrollRef, targetId);
      return;
    }

    setTimeout(() => {
      scrollToSpreadPicker(targetRef, scrollRef, targetId);
    }, delay);
  });
}
