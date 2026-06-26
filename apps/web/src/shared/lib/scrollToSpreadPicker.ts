import { Platform, type View } from 'react-native';
import {
  isTelegramMiniApp,
  readTelegramSafeAreaInsets,
} from 'shared/lib/web/telegramWebApp';

export const SPREAD_CAROUSEL_NATIVE_ID = 'spread-card-carousel';

type ScrollRef = {
  getScrollResponder?: () => unknown;
  scrollToPosition?: (x: number, y: number, animated?: boolean) => void;
} | null;

const SLOW_SCROLL_MS = 1500;
const VIEWPORT_ALIGN = 0.56;

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

function animateScrollTop(
  readTop: () => number,
  writeTop: (value: number) => void,
  targetTop: number,
  durationMs: number
): void {
  const start = readTop();
  const delta = targetTop - start;
  if (Math.abs(delta) < 3) {
    return;
  }

  const startTime = performance.now();
  const tick = (now: number) => {
    const progress = Math.min(1, (now - startTime) / durationMs);
    writeTop(start + delta * easeInOutCubic(progress));
    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  };
  requestAnimationFrame(tick);
}

function resolveHTMLElement(ref: View | null): HTMLElement | null {
  if (!ref) {
    return null;
  }

  const node = ref as unknown as HTMLElement;
  if (typeof node.getBoundingClientRect === 'function') {
    return node;
  }

  if (typeof document !== 'undefined') {
    return document.getElementById(SPREAD_CAROUSEL_NATIVE_ID);
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
    typeof (responder as { getScrollableNode?: () => HTMLElement })
      .getScrollableNode === 'function'
  ) {
    return (
      responder as { getScrollableNode: () => HTMLElement }
    ).getScrollableNode();
  }

  if (typeof (responder as HTMLElement).scrollTo === 'function') {
    return responder as HTMLElement;
  }

  return null;
}

function canScrollVertically(node: HTMLElement): boolean {
  const style = window.getComputedStyle(node);
  const overflowY = style.overflowY;
  const allowsScroll =
    overflowY === 'auto' ||
    overflowY === 'scroll' ||
    overflowY === 'overlay' ||
    overflowY === 'visible';

  return allowsScroll && node.scrollHeight > node.clientHeight + 2;
}

function findScrollableParent(element: HTMLElement): HTMLElement | null {
  let node: HTMLElement | null = element.parentElement;

  while (node) {
    if (canScrollVertically(node)) {
      return node;
    }
    node = node.parentElement;
  }

  return null;
}

function getViewportAlignOffset(): number {
  if (typeof window === 'undefined') {
    return 0;
  }

  if (isTelegramMiniApp()) {
    const tgInsets = readTelegramSafeAreaInsets();
    return tgInsets.top + 56;
  }

  return 48;
}

function computeAlignedScrollTop(
  scrollContainer: HTMLElement,
  target: HTMLElement
): number {
  const targetRect = target.getBoundingClientRect();
  const targetCenterY = targetRect.top + targetRect.height / 2;
  const desiredCenterY = window.innerHeight * VIEWPORT_ALIGN;
  return scrollContainer.scrollTop + (targetCenterY - desiredCenterY);
}

function computeWindowScrollTop(target: HTMLElement): number {
  const rect = target.getBoundingClientRect();
  const centerY = rect.top + rect.height / 2;
  const desiredY = window.innerHeight * VIEWPORT_ALIGN;
  return window.scrollY + (centerY - desiredY);
}

function scrollElementToTargetSlow(
  scrollContainer: HTMLElement,
  target: HTMLElement
): void {
  const nextTop = Math.max(0, computeAlignedScrollTop(scrollContainer, target));
  animateScrollTop(
    () => scrollContainer.scrollTop,
    (value) => {
      scrollContainer.scrollTop = value;
    },
    nextTop,
    SLOW_SCROLL_MS
  );
}

function scrollWindowToTargetSlow(target: HTMLElement): void {
  if (typeof window === 'undefined') {
    return;
  }

  const nextTop = Math.max(0, computeWindowScrollTop(target));
  animateScrollTop(
    () => window.scrollY,
    (value) => {
      window.scrollTo(0, value);
    },
    nextTop,
    SLOW_SCROLL_MS
  );
}

/** Smoothly bring the card carousel into view (web / Telegram Mini App). */
export function scrollToSpreadPicker(
  targetRef: View | null,
  scrollRef?: ScrollRef
): void {
  const topOffset = getViewportAlignOffset();

  const scrollViaMeasure = (): boolean => {
    if (!targetRef || typeof targetRef.measureLayout !== 'function') {
      return false;
    }

    const scrollResponder = scrollRef?.getScrollResponder?.();
    if (!scrollResponder) {
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
      const target = resolveHTMLElement(targetRef);
      if (!target) {
        scrollViaMeasure();
        return;
      }

      const kasvContainer = resolveScrollContainer(scrollRef);
      if (kasvContainer) {
        scrollElementToTargetSlow(kasvContainer, target);
      }

      const scrollParent = findScrollableParent(target);
      if (scrollParent && scrollParent !== kasvContainer) {
        scrollElementToTargetSlow(scrollParent, target);
      }

      scrollWindowToTargetSlow(target);

      if (!kasvContainer && !scrollParent) {
        if (!scrollViaMeasure()) {
          target.scrollIntoView?.({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest',
          });
        }
      }
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(runWebScroll);
    });
    return;
  }

  scrollViaMeasure();
}

const DEFAULT_RETRY_DELAYS = [0, 200, 450, 750, 1100, 1500];
const TELEGRAM_RETRY_DELAYS = [0, 250, 500, 800, 1200, 1600, 2000];

/** Retry slow scroll while layout settles (Telegram Mini App / web). */
export function scrollToSpreadPickerWithRetries(
  targetRef: View | null,
  scrollRef?: ScrollRef,
  delaysMs?: number[]
): void {
  const delays =
    delaysMs ??
    (isTelegramMiniApp() ? TELEGRAM_RETRY_DELAYS : DEFAULT_RETRY_DELAYS);

  delays.forEach((delay) => {
    if (delay === 0) {
      scrollToSpreadPicker(targetRef, scrollRef);
      return;
    }

    setTimeout(() => {
      scrollToSpreadPicker(targetRef, scrollRef);
    }, delay);
  });
}

/** Alias — scroll target should be the carousel wrapper ref. */
export const scrollToSpreadCarouselWithRetries = scrollToSpreadPickerWithRetries;
