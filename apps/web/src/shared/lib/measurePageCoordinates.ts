import { LayoutChangeEvent, Platform } from 'react-native';

/**
 * Top-left coordinates for animation targets.
 * Web uses viewport coords (getBoundingClientRect) to match the flying card layer.
 */
export function measurePageTopLeft(
  event: LayoutChangeEvent,
  callback: (pageX: number, pageY: number) => void
): boolean {
  if (Platform.OS === 'web') {
    const node = event.currentTarget as unknown as HTMLElement | null;
    const rect = node?.getBoundingClientRect?.();
    if (!rect) {
      return false;
    }

    callback(rect.left, rect.top);
    return true;
  }

  const measurableTarget =
    event.target && typeof event.target === 'object'
      ? (event.target as {
          measure?: (
            cb: (
              x: number,
              y: number,
              width: number,
              height: number,
              pageX: number,
              pageY: number
            ) => void
          ) => void;
        })
      : null;

  if (measurableTarget?.measure) {
    measurableTarget.measure((_x, _y, _width, _height, pageX, pageY) => {
      callback(pageX, pageY);
    });
    return true;
  }

  return false;
}

/** Center coordinates for animation start (carousel selected card). */
export function measurePageCenter(
  event: LayoutChangeEvent,
  callback: (pageX: number, pageY: number) => void
): boolean {
  if (Platform.OS === 'web') {
    const node = event.currentTarget as unknown as HTMLElement | null;
    const rect = node?.getBoundingClientRect?.();
    if (!rect) {
      return false;
    }

    callback(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return true;
  }

  const measurableTarget =
    event.target && typeof event.target === 'object'
      ? (event.target as {
          measure?: (
            cb: (
              x: number,
              y: number,
              width: number,
              height: number,
              pageX: number,
              pageY: number
            ) => void
          ) => void;
        })
      : null;

  if (measurableTarget?.measure) {
    measurableTarget.measure((_x, _y, width, height, pageX, pageY) => {
      callback(pageX + width / 2, pageY + height / 2);
    });
    return true;
  }

  return false;
}
