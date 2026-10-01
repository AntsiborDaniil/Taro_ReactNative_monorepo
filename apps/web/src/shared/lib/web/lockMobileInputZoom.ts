/**
 * App height follows the user's screen via CSS viewport units (100dvh, fallback 100vh):
 * the browser itself tracks window resize, mobile toolbars, Telegram expand, DevTools.
 *
 * JS only freezes the height in px while a text field is focused, so the soft keyboard
 * overlays content instead of shrinking the UI. Also locks pinch-zoom on inputs.
 */
const VIEWPORT =
  'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover, interactive-widget=overlays-content';

const OVERLAY_STYLE_ID = 'tarot-keyboard-overlay-layout';

/** While set on <html>, height is frozen to --tarot-app-height (keyboard open). */
const KEYBOARD_LOCK_CLASS = 'tarot-keyboard-lock';

const OVERLAY_CSS = `
html, body, #root {
  height: 100vh !important;
  max-height: 100vh !important;
}
@supports (height: 100dvh) {
  html, body, #root {
    height: 100dvh !important;
    max-height: 100dvh !important;
  }
}
html.${KEYBOARD_LOCK_CLASS}, html.${KEYBOARD_LOCK_CLASS} body, html.${KEYBOARD_LOCK_CLASS} #root {
  height: var(--tarot-app-height) !important;
  max-height: var(--tarot-app-height) !important;
}
html, body {
  overflow: hidden !important;
}
#root {
  overflow: hidden;
}
`;

function isTextInput(el: Element | null): boolean {
  if (!el) {
    return false;
  }
  return (
    el.tagName === 'INPUT' ||
    el.tagName === 'TEXTAREA' ||
    (el as HTMLElement).isContentEditable
  );
}

function lockHeightForKeyboard(): void {
  const root = document.documentElement;
  if (root.classList.contains(KEYBOARD_LOCK_CLASS)) {
    return;
  }
  // Freeze the current CSS-driven height before the keyboard can affect it.
  const height = Math.round(root.getBoundingClientRect().height);
  if (height < 1) {
    return;
  }
  root.style.setProperty('--tarot-app-height', `${height}px`);
  root.classList.add(KEYBOARD_LOCK_CLASS);
}

function unlockHeight(): void {
  const root = document.documentElement;
  root.classList.remove(KEYBOARD_LOCK_CLASS);
  root.style.removeProperty('--tarot-app-height');
}

/**
 * Re-sync after a viewport change (Telegram expand, orientation).
 * Height is CSS-driven, so this only drops a stale keyboard lock.
 */
export function syncTarotAppHeight(): void {
  if (typeof document === 'undefined') {
    return;
  }
  if (!isTextInput(document.activeElement)) {
    unlockHeight();
  }
}

function ensureOverlayCss() {
  if (typeof document === 'undefined' || document.getElementById(OVERLAY_STYLE_ID)) {
    return;
  }
  const style = document.createElement('style');
  style.id = OVERLAY_STYLE_ID;
  style.textContent = OVERLAY_CSS;
  document.head.appendChild(style);
}

export function lockMobileInputZoom(): () => void {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return () => {};
  }

  let meta = document.querySelector('meta[name="viewport"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'viewport');
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', VIEWPORT);

  ensureOverlayCss();
  unlockHeight();

  const onFocusIn = (event: FocusEvent) => {
    if (isTextInput(event.target as Element | null)) {
      lockHeightForKeyboard();
    }
  };
  // Focus may move straight to another input — check after it settles.
  const onFocusOut = () => {
    window.setTimeout(syncTarotAppHeight, 100);
  };
  const onOrientation = () => {
    unlockHeight();
  };

  document.addEventListener('focusin', onFocusIn);
  document.addEventListener('focusout', onFocusOut);
  window.addEventListener('orientationchange', onOrientation);

  return () => {
    document.removeEventListener('focusin', onFocusIn);
    document.removeEventListener('focusout', onFocusOut);
    window.removeEventListener('orientationchange', onOrientation);
    unlockHeight();
  };
}
