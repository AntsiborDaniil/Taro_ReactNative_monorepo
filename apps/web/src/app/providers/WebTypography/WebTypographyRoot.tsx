import { useEffect } from 'react';
import { Dimensions, Platform } from 'react-native';
import { clearCssVarCache } from 'shared/themes/responsive-tokens';
import { RESPONSIVE_TOKENS_CSS } from 'shared/themes/responsive-tokens-css-content';

const STYLE_ID = 'tarot-responsive-tokens';

/**
 * Web: подключает responsive-tokens.css и сбрасывает кеш CSS-переменных при resize.
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

    const subscription = Dimensions.addEventListener('change', () => {
      clearCssVarCache();
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return null;
}
