export const OrientationLock = {
  DEFAULT: 'DEFAULT',
  ALL: 'ALL',
  PORTRAIT: 'PORTRAIT',
  PORTRAIT_UP: 'PORTRAIT_UP',
  PORTRAIT_DOWN: 'PORTRAIT_DOWN',
  LANDSCAPE: 'LANDSCAPE',
  LANDSCAPE_LEFT: 'LANDSCAPE_LEFT',
  LANDSCAPE_RIGHT: 'LANDSCAPE_RIGHT',
  OTHER: 'OTHER',
  UNKNOWN: 'UNKNOWN',
} as const;

export const lockAsync = async (_orientationLock: unknown): Promise<void> => {};
export const unlockAsync = async (): Promise<void> => {};
export const getOrientationAsync = async () => 1;
