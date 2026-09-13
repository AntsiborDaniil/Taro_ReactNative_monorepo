/**
 * Keep the app layout height fixed so the keyboard overlays content
 * instead of shrinking the UI. Also lock pinch-zoom on inputs.
 *
 * Desktop / Telegram Desktop Mini App: height must grow after WebApp.expand(),
 * otherwise the UI stays cropped with empty space below.
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

/** Largest stable viewport height; ignore keyboard shrink. */
let baselineHeight = 0;

function readViewportHeight(): number {
  if (typeof window === 'undefined') {
    return 0;
  }
  // Prefer layout viewport for Mini App chrome; visualViewport shrinks with keyboard.
  return Math.round(window.innerHeight);
}

function applyAppHeight(height: number): void {
  if (typeof document === 'undefined' || height < 1) {
    return;
  }
  document.documentElement.style.setProperty(
    '--tarot-app-height',
    `${height}px`
  );
}

/**
 * Sync layout height. Grows when the window expands (TG Desktop expand).
 * Does not shrink for soft keyboard (keeps overlay behavior).
 */
export function syncTarotAppHeight(options?: { reset?: boolean }): void {
  if (typeof window === 'undefined') {
    return;
  }
  const height = readViewportHeight();
  if (height < 1) {
    return;
  }
  if (options?.reset) {
    baselineHeight = height;
    applyAppHeight(height);
    return;
  }
  // Allow tiny jitter down; otherwise only grow (expand / resize up).
  if (baselineHeight < 1 || height >= baselineHeight - 24) {
    baselineHeight = Math.max(baselineHeight, height);
    applyAppHeight(baselineHeight);
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
  syncTarotAppHeight({ reset: true });

  const onResize = () => {
    syncTarotAppHeight();
  };
  const onOrientation = () => {
    window.setTimeout(() => syncTarotAppHeight({ reset: true }), 250);
  };

  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onOrientation);
  window.visualViewport?.addEventListener('resize', onResize);

  // Telegram Desktop Mini App expands shortly after ready().
  const timers = [100, 400, 1000, 2000].map((ms) =>
    window.setTimeout(() => syncTarotAppHeight(), ms)
  );

  return () => {
    window.removeEventListener('resize', onResize);
    window.removeEventListener('orientationchange', onOrientation);
    window.visualViewport?.removeEventListener('resize', onResize);
    for (const id of timers) {
      window.clearTimeout(id);
    }
  };
}
