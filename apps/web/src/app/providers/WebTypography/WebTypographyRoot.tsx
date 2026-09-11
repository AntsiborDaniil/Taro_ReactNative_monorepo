import { useEffect } from 'react';
import { Dimensions, Platform } from 'react-native';
import { clearCssVarCache } from 'shared/themes/responsive-tokens';
import { RESPONSIVE_TOKENS_CSS } from 'shared/themes/responsive-tokens-css-content';

const STYLE_ID = 'tarot-responsive-tokens';
const FANTASY_STYLE_ID = 'tarot-fantasy-atmosphere';
const INPUT_ZOOM_STYLE_ID = 'tarot-no-input-zoom';

const FANTASY_MOTION_CSS = `
@keyframes tarotOrbPulse {
  0%, 100% { transform: scale(1); opacity: 0.85; }
  50% { transform: scale(1.08); opacity: 1; }
}
@keyframes tarotStarTwinkle {
  0%, 100% { opacity: 0.25; }
  50% { opacity: 0.85; }
}
`;

const NO_INPUT_ZOOM_CSS = `
html {
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
}
input, textarea, select {
  touch-action: manipulation;
}
@media (max-width: 900px) {
  input, textarea, select {
    font-size: 16px !important;
    line-height: 1.25 !important;
    transform: none !important;
  }
}
`;

const VIEWPORT_CONTENT =
  'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover';

function isCoarseMobile(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.matchMedia('(max-width: 900px), (pointer: coarse)').matches;
}

function isFormField(target: EventTarget | null): target is HTMLElement {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

function lockViewportMeta(): HTMLMetaElement | null {
  if (typeof document === 'undefined') {
    return null;
  }
  let meta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement | null;
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'viewport';
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', VIEWPORT_CONTENT);
  return meta;
}

function resetMobileKeyboardZoom(): void {
  lockViewportMeta();
  const visual = window.visualViewport;
  if (
    visual &&
    (visual.offsetTop > 1 || visual.scale > 1.01)
  ) {
    window.scrollTo(0, 0);
  }
  document.documentElement.style.overflow = '';
  if (document.body) {
    document.body.style.height = '';
  }
}

/**
 * Web: подключает responsive-tokens.css и fantasy motion keyframes.
 */
export function WebTypographyRoot() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      return;
    }

    lockViewportMeta();

    let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement('style');
      style.id = STYLE_ID;
      style.setAttribute('data-source', 'responsive-tokens.css');
      document.head.appendChild(style);
    }
    style.textContent = RESPONSIVE_TOKENS_CSS;

    let fantasyStyle = document.getElementById(
      FANTASY_STYLE_ID
    ) as HTMLStyleElement | null;
    if (!fantasyStyle) {
      fantasyStyle = document.createElement('style');
      fantasyStyle.id = FANTASY_STYLE_ID;
      document.head.appendChild(fantasyStyle);
    }
    fantasyStyle.textContent = FANTASY_MOTION_CSS;

    let zoomStyle = document.getElementById(
      INPUT_ZOOM_STYLE_ID
    ) as HTMLStyleElement | null;
    if (!zoomStyle) {
      zoomStyle = document.createElement('style');
      zoomStyle.id = INPUT_ZOOM_STYLE_ID;
      document.head.appendChild(zoomStyle);
    }
    zoomStyle.textContent = NO_INPUT_ZOOM_CSS;

    const onFocusIn = (event: FocusEvent) => {
      if (!isCoarseMobile() || !isFormField(event.target)) {
        return;
      }
      lockViewportMeta();
    };

    const onFocusOut = (event: FocusEvent) => {
      if (!isFormField(event.target)) {
        return;
      }
      window.setTimeout(resetMobileKeyboardZoom, 50);
      window.setTimeout(resetMobileKeyboardZoom, 350);
    };

    const onVisualViewportResize = () => {
      if (!isCoarseMobile() || !window.visualViewport) {
        return;
      }
      const keyboardClosed =
        Math.abs(window.visualViewport.height - window.innerHeight) < 80;
      if (keyboardClosed) {
        resetMobileKeyboardZoom();
      }
    };

    document.addEventListener('focusin', onFocusIn, true);
    document.addEventListener('focusout', onFocusOut);
    window.visualViewport?.addEventListener('resize', onVisualViewportResize);

    const subscription = Dimensions.addEventListener('change', () => {
      clearCssVarCache();
    });

    return () => {
      subscription.remove();
      document.removeEventListener('focusin', onFocusIn, true);
      document.removeEventListener('focusout', onFocusOut);
      window.visualViewport?.removeEventListener(
        'resize',
        onVisualViewportResize
      );
    };
  }, []);

  return null;
}
