import { useMobileFabHostScreen } from 'app/navigation/tabs/MobileFabScrollContext';
import { useEffect, useState } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { readTelegramSafeAreaInsets } from './telegramWebApp';

const TAB_BREAKPOINT_RAIL = 900;
const WEB_FAB_NAV_SIZE = 48;

function isWebMobileFabNav(width: number): boolean {
  return Platform.OS === 'web' && width < TAB_BREAKPOINT_RAIL;
}

export type LayoutViewportInsets = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

/** Chrome/Safari toolbar — ignore keyboard-sized visualViewport shrink. */
const MAX_BROWSER_CHROME_INSET = 80;

function readBrowserChromeBottomInset(): number {
  if (typeof window === 'undefined') {
    return 0;
  }

  const vv = window.visualViewport;
  if (!vv) {
    return 0;
  }

  const gap = window.innerHeight - (vv.height + vv.offsetTop);
  const chrome = Math.max(0, Math.round(gap));
  if (chrome > MAX_BROWSER_CHROME_INSET) {
    return 0;
  }
  return chrome;
}

function readCssSafeAreaInsets(): LayoutViewportInsets {
  if (typeof document === 'undefined' || !document.body) {
    return { top: 0, bottom: 0, left: 0, right: 0 };
  }

  const probe = document.createElement('div');
  probe.style.cssText =
    'position:fixed;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);';
  document.body.appendChild(probe);
  const style = getComputedStyle(probe);
  const parse = (value: string) => Number.parseFloat(value) || 0;
  const insets = {
    top: parse(style.paddingTop),
    bottom: parse(style.paddingBottom),
    left: parse(style.paddingLeft),
    right: parse(style.paddingRight),
  };
  document.body.removeChild(probe);
  return insets;
}

/**
 * Safe area + mobile browser chrome on web (visualViewport).
 * Native: react-native-safe-area-context only.
 */
export function useWebViewportInsets(): LayoutViewportInsets {
  const safe = useSafeAreaInsets();
  const [webExtra, setWebExtra] = useState<LayoutViewportInsets>({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      return;
    }

    const update = () => {
      const css = readCssSafeAreaInsets();
      const browserBottom = readBrowserChromeBottomInset();
      setWebExtra({
        top: css.top,
        bottom: Math.max(css.bottom, browserBottom),
        left: css.left,
        right: css.right,
      });
    };

    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);

    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  if (Platform.OS !== 'web') {
    return {
      top: safe.top,
      bottom: safe.bottom,
      left: safe.left,
      right: safe.right,
    };
  }

  const telegramInsets = readTelegramSafeAreaInsets();

  return {
    top: Math.max(safe.top, webExtra.top, telegramInsets.top),
    bottom: Math.max(safe.bottom, webExtra.bottom, telegramInsets.bottom),
    left: Math.max(safe.left, webExtra.left, telegramInsets.left),
    right: Math.max(safe.right, webExtra.right, telegramInsets.right),
  };
}

/** Высота нижней tab bar + отступ от плашки браузера (только web, нижняя навигация). */
export const WEB_TAB_BAR_CONTENT_HEIGHT = 56;

export function useWebBottomTabBarInset(): number {
  const insets = useWebViewportInsets();
  const { width } = useWindowDimensions();
  const fabHostScreen = useMobileFabHostScreen();
  if (Platform.OS !== 'web') {
    return insets.bottom;
  }
  if (isWebMobileFabNav(width)) {
    if (!fabHostScreen) {
      return insets.bottom + 16;
    }
    return WEB_FAB_NAV_SIZE + insets.bottom + 16;
  }
  if (width >= TAB_BREAKPOINT_RAIL) {
    return insets.bottom + 8;
  }
  /** Tablet bottom tab bar + browser chrome. */
  return WEB_TAB_BAR_CONTENT_HEIGHT + insets.bottom + 16;
}
