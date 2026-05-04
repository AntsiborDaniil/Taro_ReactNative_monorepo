import type { ReactNode } from 'react';
import { Platform } from 'react-native';
import { Bell, GetIcon, Lang, Paint, Share, Star } from 'shared/icons';
import { isTablet } from 'shared/lib';
import { NavigationRoute } from 'shared/types';
import { rateApp, shareApp } from 'shared/utils';

export type SettingsRouteItem = {
  icon: ReactNode;
  /** Ключ i18n под namespace `settings:` */
  title: string;
  url?: NavigationRoute;
  onPress?: (t?: import('i18next').TFunction<'translation', undefined>) => void;
};

const SETTINGS_ROUTES_NATIVE: SettingsRouteItem[] = [
  {
    icon: <Lang width={isTablet ? 34 : 24} height={isTablet ? 34 : 24} />,
    title: 'language',
    url: NavigationRoute.Language,
  },
  {
    icon: <Bell width={isTablet ? 34 : 24} height={isTablet ? 33 : 23} />,
    title: 'sound',
    url: NavigationRoute.Sound,
  },
  {
    icon: <Paint width={isTablet ? 34 : 24} height={isTablet ? 34 : 24} />,
    title: 'deck.style',
    url: NavigationRoute.DeckStyle,
  },
  {
    icon: <Share width={isTablet ? 30 : 20} height={isTablet ? 30 : 20} />,
    title: 'share',
    onPress: shareApp,
  },
  {
    icon: <Star width={isTablet ? 32 : 22} height={isTablet ? 31 : 21} />,
    title: 'rate.app',
    onPress: rateApp,
  },
];

export type GetSettingsRoutesOptions = {
  /** Web: открыть выбор App Store / Google Play */
  onMobileAppPress?: () => void;
};

export function getSettingsRoutes(
  opts?: GetSettingsRoutesOptions
): SettingsRouteItem[] {
  if (Platform.OS !== 'web') {
    return SETTINGS_ROUTES_NATIVE;
  }

  return [
    {
      icon: <Lang width={isTablet ? 34 : 24} height={isTablet ? 34 : 24} />,
      title: 'language',
      url: NavigationRoute.Language,
    },
    {
      icon: <Paint width={isTablet ? 34 : 24} height={isTablet ? 34 : 24} />,
      title: 'deck.style',
      url: NavigationRoute.DeckStyle,
    },
    {
      icon: <Share width={isTablet ? 30 : 20} height={isTablet ? 30 : 20} />,
      title: 'share.web',
      onPress: shareApp,
    },
    {
      icon: <GetIcon width={isTablet ? 32 : 24} height={isTablet ? 32 : 24} />,
      title: 'mobile.app',
      onPress: () => opts?.onMobileAppPress?.(),
    },
  ];
}

export const APP_AGREEMENTS = [
  {
    title: 'terms.of.use',
    url: NavigationRoute.TermsOfUse,
  },
  {
    title: 'privacy.policy',
    url: NavigationRoute.PrivacyPolicy,
  },
];
