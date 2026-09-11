/**
 * Keep the app layout height fixed so the keyboard overlays content
 * instead of shrinking the UI. Also lock pinch-zoom on inputs.
 */
const VIEWPORT =
  'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover, interactive-widget=overlays-content';

const OVERLAY_STYLE_ID = 'tarot-keyboard-overlay-layout';

const OVERLAY_CSS = `
html, body {
  height: var(--tarot-app-height, 100dvh) !important;
  max-height: var(--tarot-app-height, 100dvh) !important;
  overflow: hidden !important;
}
#root {
  height: var(--tarot-app-height, 100dvh) !important;
  max-height: var(--tarot-app-height, 100dvh) !important;
  overflow: hidden;
}
`;

function freezeAppHeight() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }
  const height = Math.round(window.innerHeight);
  if (height < 1) {
    return;
  }
  document.documentElement.style.setProperty('--tarot-app-height', `${height}px`);
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
  freezeAppHeight();

  const onOrientation = () => {
    window.setTimeout(freezeAppHeight, 250);
  };

  window.addEventListener('orientationchange', onOrientation);

  return () => {
    window.removeEventListener('orientationchange', onOrientation);
  };
}
