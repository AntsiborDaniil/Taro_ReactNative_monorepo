/**
 * Prevent iOS / Telegram from pinch-zooming into inputs (font < 16px).
 * Do not toggle viewport or scroll on keyboard — that leaves an empty layout gap.
 */
const VIEWPORT =
  'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover';

export function lockMobileInputZoom(): () => void {
  if (typeof document === 'undefined') {
    return () => {};
  }

  let meta = document.querySelector('meta[name="viewport"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'viewport');
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', VIEWPORT);

  return () => {};
}
