import { Platform, type View } from 'react-native';

type ScrollRef = {
  getScrollResponder?: () => unknown;
  scrollToPosition?: (x: number, y: number, animated?: boolean) => void;
} | null;

/** Smoothly bring the card picker (altar / carousel) into view. */
export function scrollToSpreadPicker(
  targetRef: View | null,
  scrollRef?: ScrollRef
): void {
  if (!targetRef) {
    return;
  }

  const scrollViaMeasure = (): boolean => {
    const scrollResponder = scrollRef?.getScrollResponder?.();
    if (!scrollResponder || typeof targetRef.measureLayout !== 'function') {
      return false;
    }

    const scrollNode = scrollResponder as unknown as View;
    targetRef.measureLayout(
      scrollNode,
      (_x, y) => {
        scrollRef?.scrollToPosition?.(0, Math.max(0, y - 72), true);
      },
      () => {
        /* ignore measure errors */
      }
    );
    return true;
  };

  if (Platform.OS === 'web') {
    if (!scrollViaMeasure()) {
      const node = targetRef as unknown as HTMLElement;
      node?.scrollIntoView?.({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    }
    return;
  }

  scrollViaMeasure();
}
