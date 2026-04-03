import { Dimensions, Platform } from 'react-native';
import { SHELL_MAX_WIDTH, SIDEBAR_WIDTH, getBreakpoint } from './breakpoints';

const { width: rawWidth, height: rawHeight } = Dimensions.get('window');

const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

// ─────────────────────────────────────────────────────────────────────────────
// Two separate concepts:
//
// 1. SCALE_WIDTH  — used for font sizes, icon sizes, paddings.
//    Always capped at the mobile baseline (430 px) so text never grows
//    bigger than on a phone, regardless of how wide the browser is.
//
// 2. width (layout) — used for card/grid calculations.
//    The actual available content area (viewport − sidebar) so items
//    fill the screen properly.
// ─────────────────────────────────────────────────────────────────────────────

/** Font/icon scaling is always mobile-like, max 430 px */
const MOBILE_SCALE_CAP = 430;
const SCALE_WIDTH = Platform.OS === 'web' ? Math.min(rawWidth, MOBILE_SCALE_CAP) : rawWidth;
const SCALE_HEIGHT = Platform.OS === 'web' ? Math.min(rawHeight, 932) : rawHeight;

/** Layout width — the usable content area at the current breakpoint */
function getWebLayoutWidth(w: number): number {
  const bp = getBreakpoint(w);
  const shellMax = SHELL_MAX_WIDTH[bp];       // 430 / 900 / ∞
  const sidebarW = bp === 'mobile' ? 0 : SIDEBAR_WIDTH[bp];
  return Math.min(w, shellMax) - sidebarW;
}

// Exported layout width (card widths etc. use this)
export const width =
  Platform.OS === 'web' ? getWebLayoutWidth(rawWidth) : rawWidth;
export const height =
  Platform.OS === 'web' ? SCALE_HEIGHT : rawHeight;

export const isTablet = false;

// Scaling functions always use the MOBILE cap — text stays proportional
export const horizontalScale = (size: number) => (SCALE_WIDTH / BASE_WIDTH) * size;

export const verticalScale = (size: number) => (SCALE_HEIGHT / BASE_HEIGHT) * size;

export const moderateScale = (size: number, factor = 0.5) =>
  size + (horizontalScale(size) - size) * factor;
