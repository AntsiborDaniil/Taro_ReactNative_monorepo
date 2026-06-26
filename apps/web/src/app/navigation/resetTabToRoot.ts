import { CommonActions } from '@react-navigation/native';
import { NavigationRoute, TabRoute } from 'shared/types';

const TAB_ROOT_SCREEN: Record<TabRoute, NavigationRoute> = {
  [TabRoute.MainTab]: NavigationRoute.Main,
  [TabRoute.SpreadsTab]: NavigationRoute.Spreads,
  [TabRoute.LibraryTab]: NavigationRoute.Library,
};

/** Reset a tab navigator and its inner stack to the root screen (e.g. Library, not Auth). */
export function createResetTabToRootAction(tab: TabRoute) {
  return CommonActions.reset({
    index: 0,
    routes: [
      {
        name: tab,
        state: {
          index: 0,
          routes: [{ name: TAB_ROOT_SCREEN[tab] }],
        },
      },
    ],
  });
}
