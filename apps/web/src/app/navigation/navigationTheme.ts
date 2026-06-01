import { DarkTheme, type Theme } from '@react-navigation/native';
import { COLORS } from 'shared/themes';

export const tarotNavigationTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: COLORS.Primary,
    background: COLORS.Background,
    card: COLORS.Background,
    text: COLORS.Content,
    border: COLORS.SpbSky3,
    notification: COLORS.Accent,
  },
};
