import type { BottomTabNavigationState } from '@react-navigation/bottom-tabs';
import { NavigationRoute } from 'shared/types';

/** Root tab screens where the mobile FAB stays available (not spread sessions, settings, etc.). */
export const FAB_HOST_ROUTES: ReadonlySet<string> = new Set([
  NavigationRoute.Main,
  NavigationRoute.Library,
  NavigationRoute.Spreads,
]);

type TabStackState = {
  routes: Array<{ name: string }>;
  index: number;
};

export function isFabHostScreenFromTabState(
  state: BottomTabNavigationState
): boolean {
  const tabRoute = state.routes[state.index];
  const stackState = tabRoute?.state as TabStackState | undefined;

  if (!stackState?.routes?.length) {
    return true;
  }

  const routeName = stackState.routes[stackState.index ?? 0]?.name;
  return FAB_HOST_ROUTES.has(routeName);
}
