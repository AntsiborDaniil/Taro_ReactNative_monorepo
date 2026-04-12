import { Bell, Lang, Paint, Payments, Share, Star } from 'shared/icons';
import { isTablet } from 'shared/lib';
import { NavigationRoute } from 'shared/types';
import { rateApp, shareApp } from 'shared/utils';

export const SETTINGS_ROUTES = [
  // {
  //   icon: <Payments width={isTablet ? 37 : 27} height={isTablet ? 33 : 23} />,
  //   title: 'payments',
  // },
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
    icon: <Share width={isTablet ? 30 : 20} height={isTablet ? 31 : 21} />,
    title: 'share',
    onPress: shareApp,
  },
  {
    icon: <Star width={isTablet ? 32 : 22} height={isTablet ? 31 : 21} />,
    title: 'rate.app',
    onPress: rateApp,
  },
];

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
