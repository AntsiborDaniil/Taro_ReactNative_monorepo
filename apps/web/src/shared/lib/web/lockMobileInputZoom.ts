/**
 * iOS / Telegram Mini App zoom into inputs (font < 16px) and often never zoom back.
 * Lock scale so the keyboard never pinches the page; reset viewport on blur.
 */
const VIEWPORT =
  'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover';

function applyViewport(meta: Element) {
  meta.setAttribute('content', VIEWPORT);
}

function restoreAfterKeyboard() {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return;
  }

  const meta = document.querySelector('meta[name="viewport"]');
  if (meta) {
    // iOS sometimes keeps a pinch-zoom after blur; toggling max-scale resets it.
    meta.setAttribute(
      'content',
      'width=device-width, initial-scale=1, maximum-scale=1.0001, user-scalable=no, viewport-fit=cover'
    );
    requestAnimationFrame(() => applyViewport(meta));
  }

  window.scrollTo({ top: window.scrollY, left: 0 });
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
  applyViewport(meta);

  const onFocusOut = (event: Event) => {
    const target = event.target;
    if (
      target instanceof HTMLElement &&
      target.matches('input, textarea, [contenteditable="true"]')
    ) {
      restoreAfterKeyboard();
    }
  };

  window.addEventListener('focusout', onFocusOut, true);
  window.visualViewport?.addEventListener('resize', restoreAfterKeyboard);

  return () => {
    window.removeEventListener('focusout', onFocusOut, true);
    window.visualViewport?.removeEventListener('resize', restoreAfterKeyboard);
  };
}
