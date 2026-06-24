import { useEffect } from 'react';
import { Platform } from 'react-native';
import { navigationRef } from 'app/navigation/navigationRef';

const SWIPE_THRESHOLD_PX = 40;
const MAX_VERTICAL_DRIFT_PX = 64;

const INTERACTIVE_SELECTOR = [
  'input',
  'textarea',
  'select',
  'button',
  'a[href]',
  'summary',
  'label',
  '[contenteditable="true"]',
  '[role="button"]',
  '[role="link"]',
  '[role="tab"]',
  '[role="menuitem"]',
  '[role="switch"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="slider"]',
  '[role="spinbutton"]',
  '[role="combobox"]',
  '[role="listbox"]',
  '[role="option"]',
  '[role="textbox"]',
  '[data-tarot-card-tile]',
  '.tarot-web-scroll-x',
  '[data-tarot-no-swipe-back]',
].join(', ');

function isSwipeExcluded(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.closest(INTERACTIVE_SELECTOR)) {
    return true;
  }

  const interactive = target.closest(
    '[tabindex]:not([tabindex="-1"]), [onclick], [data-pressable="true"]'
  );
  if (interactive instanceof HTMLElement) {
    return true;
  }

  return false;
}

function tryGoBack(): void {
  if (!navigationRef.isReady() || !navigationRef.canGoBack()) {
    return;
  }
  navigationRef.goBack();
}

/**
 * Web / Telegram Mini App: swipe right anywhere on the page to go back,
 * unless the gesture starts on an interactive control.
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
