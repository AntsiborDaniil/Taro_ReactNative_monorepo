import { useEffect } from 'react';
import { Platform } from 'react-native';
import { navigationRef } from '../../navigation/navigationRef';

const STYLE_ID = 'tarot-web-a11y-global';

function isTypingTarget(target: EventTarget | null): boolean {
  if (typeof document === 'undefined') {
    return false;
  }

  if (!target || !(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(
    target.closest(
      'input, textarea, select, [contenteditable="true"], [role="textbox"]'
    )
  );
}

const GLOBAL_A11Y_CSS = `
html {
  -webkit-text-size-adjust: 100%;
}
body {
  overscroll-behavior-y: contain;
  overscroll-behavior-x: contain;
}
.tarot-web-scroll-x {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: contain;
  touch-action: pan-x;
}
@media (pointer: fine) {
  *:focus-visible {
    outline: 2px solid rgba(246, 192, 27, 0.95);
    outline-offset: 2px;
  }
}
`;

/**
 * Web: Escape → назад в истории навигации, глобальные стили фокуса и overscroll
 * (тачпад / жест «отскок» у края, без ухода истории браузера).
 */
export function WebA11yRoot() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      return;
    }

    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = GLOBAL_A11Y_CSS;
      document.head.appendChild(style);
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return;
      }

      if (isTypingTarget(event.target)) {
        return;
      }

      if (!navigationRef.isReady() || !navigationRef.canGoBack()) {
        return;
      }

      event.preventDefault();
      navigationRef.goBack();
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  return null;
}
