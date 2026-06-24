import { useEffect } from 'react';
import { Platform } from 'react-native';
import { navigationRef } from 'app/navigation/navigationRef';

const EDGE_ZONE_PX = 28;
const SWIPE_THRESHOLD_PX = 56;
const MAX_VERTICAL_DRIFT_PX = 48;

function isSwipeExcluded(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(
    target.closest(
      'input, textarea, select, [contenteditable="true"], [role="textbox"], [data-tarot-card-tile], .tarot-web-scroll-x, [data-tarot-no-swipe-back]'
    )
  );
}

function tryGoBack(): void {
  if (!navigationRef.isReady() || !navigationRef.canGoBack()) {
    return;
  }
  navigationRef.goBack();
}

/**
 * Web / Telegram Mini App: swipe from the left edge to go to the previous screen.
 */
export function useWebSwipeBack(): void {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      return;
    }

    let startX = 0;
    let startY = 0;
    let tracking = false;

    const onTouchStart = (event: TouchEvent): void => {
      if (event.touches.length !== 1 || isSwipeExcluded(event.target)) {
        tracking = false;
        return;
      }

      const touch = event.touches[0];
      if (touch.clientX > EDGE_ZONE_PX) {
        tracking = false;
        return;
      }

      startX = touch.clientX;
      startY = touch.clientY;
      tracking = true;
    };

    const onTouchEnd = (event: TouchEvent): void => {
      if (!tracking || event.changedTouches.length !== 1) {
        tracking = false;
        return;
      }

      const touch = event.changedTouches[0];
      const dx = touch.clientX - startX;
      const dy = Math.abs(touch.clientY - startY);
      tracking = false;

      if (dx >= SWIPE_THRESHOLD_PX && dy <= MAX_VERTICAL_DRIFT_PX) {
        tryGoBack();
      }
    };

    const onTouchCancel = (): void => {
      tracking = false;
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    document.addEventListener('touchcancel', onTouchCancel, { passive: true });

    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('touchcancel', onTouchCancel);
    };
  }, []);
}
