import { useEffect } from 'react';
import { Dimensions, Platform } from 'react-native';
import { clearCssVarCache } from 'shared/themes/responsive-tokens';
import { RESPONSIVE_TOKENS_CSS } from 'shared/themes/responsive-tokens-css-content';

const STYLE_ID = 'tarot-responsive-tokens';
const FANTASY_STYLE_ID = 'tarot-fantasy-atmosphere';

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

/**
 * Web: подключает responsive-tokens.css и fantasy motion keyframes.
 */
export function WebTypographyRoot() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      return;
    }

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

    const subscription = Dimensions.addEventListener('change', () => {
      clearCssVarCache();
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return null;
}
