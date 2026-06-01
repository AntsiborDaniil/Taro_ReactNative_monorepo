import { Platform } from 'react-native';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { COLORS } from 'shared/themes';

/** Единый тёмный фон стеков — без белой вспышки при переходах (web). */
export const darkStackScreenOptions: NativeStackNavigationOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: COLORS.Background },
  ...(Platform.OS === 'web'
    ? {
        animation: 'fade',
        animationDuration: 160,
      }
    : {}),
};
