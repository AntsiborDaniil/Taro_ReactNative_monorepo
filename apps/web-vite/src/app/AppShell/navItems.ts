import type { ComponentType, SVGProps } from 'react';
import { BookIcon, CardsIcon, PlanetIcon, SettingsIcon } from './icons';

export type NavItem = {
  to: string;
  /** Ключ core.json (nav.tab.* или nav.fab.*), см. apps/web/src/app/navigation/tabs. */
  labelKey: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  isActive: (pathname: string) => boolean;
};

export const MAIN_NAV_ITEMS: NavItem[] = [
  {
    to: '/',
    labelKey: 'nav.tab.main',
    Icon: PlanetIcon,
    isActive: (p) => p === '/',
  },
  {
    to: '/spreads',
    labelKey: 'nav.tab.spreads',
    Icon: CardsIcon,
    isActive: (p) =>
      p.startsWith('/spreads') || p.startsWith('/reading') || p.startsWith('/card') || p.startsWith('/history'),
  },
  {
    to: '/library',
    labelKey: 'nav.tab.library',
    Icon: BookIcon,
    isActive: (p) =>
      p.startsWith('/library') ||
      p.startsWith('/dictionary') ||
      p.startsWith('/favorites') ||
      p.startsWith('/affirmations') ||
      p.startsWith('/habits') ||
      p.startsWith('/mood') ||
      p.startsWith('/motivation') ||
      p.startsWith('/day-advice') ||
      p.startsWith('/goal'),
  },
];

export const SETTINGS_NAV_ITEM: NavItem = {
  to: '/settings',
  labelKey: 'nav.fab.settings',
  Icon: SettingsIcon,
  isActive: (p) => p.startsWith('/settings'),
};

export const ALL_NAV_ITEMS: NavItem[] = [...MAIN_NAV_ITEMS, SETTINGS_NAV_ITEM];
