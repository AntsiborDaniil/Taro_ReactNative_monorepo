import { Platform, type View } from 'react-native';
import { isTelegramMiniApp } from 'shared/lib/web/telegramWebApp';

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

  if (typeof (responder as { getScrollableNode?: () => HTMLElement }).getScrollableNode === 'function') {
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

function scrollElementToTarget(
  scrollContainer: HTMLElement,
  target: HTMLElement,
  topOffset: number
): void {
  const containerRect = scrollContainer.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const nextTop =
    scrollContainer.scrollTop + (targetRect.top - containerRect.top) - topOffset;

  scrollContainer.scrollTo({
    top: Math.max(0, nextTop),
    behavior: 'smooth',
  });
}

/** Smoothly bring the card picker (altar / carousel) into view. */
export function scrollToSpreadPicker(
  targetRef: View | null,
  scrollRef?: ScrollRef
): void {
  if (!targetRef) {
    return;
  }

  const topOffset = isTelegramMiniApp() ? 108 : 72;

  const scrollViaMeasure = (): boolean => {
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
      const target = resolveHTMLElement(targetRef);
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
  delaysMs: number[] = [0, 120, 320, 560]
): void {
  delaysMs.forEach((delay) => {
    if (delay === 0) {
      scrollToSpreadPicker(targetRef, scrollRef);
      return;
    }

    setTimeout(() => {
      scrollToSpreadPicker(targetRef, scrollRef);
    }, delay);
  });
}
