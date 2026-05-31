import { Platform } from 'react-native';

/** Плавный переход для hover/press на web (вешать на базовый стиль, не на *Hover). */
export const WEB_HOVER_TRANSITION = Platform.select({
  web: {
    transition:
      'background-color 0.2s ease, opacity 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, filter 0.2s ease, transform 0.2s ease, color 0.2s ease',
  } as object,
  default: {},
});
