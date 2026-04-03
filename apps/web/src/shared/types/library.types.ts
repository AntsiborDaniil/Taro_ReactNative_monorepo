import { NavigationRoute, TabRoute } from './navigation.types';

export type TRedirectPlate = {
  id: number | string;
  name: string;
  img: string;
  navigationRoute: NavigationRoute;
  tabRoute: TabRoute;
  gradient?: readonly [string, string, ...string[]];
  background?: string;
};
