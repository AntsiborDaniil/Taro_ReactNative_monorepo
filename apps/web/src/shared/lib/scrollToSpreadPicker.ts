import { Platform, type View } from 'react-native';
import {
  isTelegramMiniApp,
  readTelegramSafeAreaInsets,
} from 'shared/lib/web/telegramWebApp';

export const SPREAD_PICKER_NATIVE_ID = 'spread-card-picker';

type ScrollRef = {
  getScrollResponder?: () => unknown;
  scrollToPosition?: (x: number, y: number, animated?: boolean) => void;
} | null;

function resolveHTMLElement(ref: View | null): HTMLElement | null {
  if (!ref) {
    return null;
  }

  const node = ref as unknown as HTMLElement;
  if (typeof node.getBoundingClientRect === 'function') {
    return node;
  }

  if (typeof document !== 'undefined') {
    return document.getElementById(SPREAD_PICKER_NATIVE_ID);
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

function getScrollTopOffset(): number {
  if (isTelegramMiniApp()) {
    const tgInsets = readTelegramSafeAreaInsets();
    return tgInsets.top + 72;
  }

  return 64;
}

function scrollElementToTarget(
  scrollContainer: HTMLElement,
  target: HTMLElement,
  topOffset: number
): void {
  const containerRect = scrollContainer.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const nextTop =
    scrollContainer.scrollTop +
    (targetRect.top - containerRect.top) -
    topOffset;

  scrollContainer.scrollTo({
    top: Math.max(0, nextTop),
    behavior: 'smooth',
  });
}

function scrollWindowToTarget(target: HTMLElement, topOffset: number): void {
  if (typeof window === 'undefined') {
    return;
  }

  const rect = target.getBoundingClientRect();
  const nextTop = window.scrollY + rect.top - topOffset;

  window.scrollTo({
    top: Math.max(0, nextTop),
    behavior: 'smooth',
  });
}

/** Smoothly bring the card picker (altar / carousel) into view. */
export function scrollToSpreadPicker(
  targetRef: View | null,
  scrollRef?: ScrollRef
): void {
  const topOffset = getScrollTopOffset();

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
        scrollElementToTarget(kasvContainer, target, topOffset);
      }

      const scrollParent = findScrollableParent(target);
      if (scrollParent && scrollParent !== kasvContainer) {
        scrollElementToTarget(scrollParent, target, topOffset);
      }

      if (isTelegramMiniApp()) {
        scrollWindowToTarget(target, topOffset);
      }

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

const DEFAULT_RETRY_DELAYS = [0, 120, 320, 560];
const TELEGRAM_RETRY_DELAYS = [0, 200, 450, 750, 1100, 1500];

/** Retry scroll while layout settles (Telegram Mini App / web). */
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
