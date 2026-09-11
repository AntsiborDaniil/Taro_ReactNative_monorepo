import {
  CommonActions,
  type NavigationProp,
  type NavigationState,
  type ParamListBase,
} from '@react-navigation/native';
import { NavigationRoute, TabRoute } from 'shared/types';
import {
  type NavReturnPoint,
  setNavReturn,
} from './navReturnStore';

const TAB_ROOT_SCREEN: Record<TabRoute, NavigationRoute> = {
  [TabRoute.MainTab]: NavigationRoute.Main,
  [TabRoute.SpreadsTab]: NavigationRoute.Spreads,
  [TabRoute.LibraryTab]: NavigationRoute.Library,
};

type NavigateInTabOptions = {
  tab: TabRoute;
  screen: NavigationRoute;
  params?: Record<string, unknown>;
  /**
   * If true (default), nested stack becomes [tabRoot, screen]
   * so Back never returns to a sibling (e.g. Dictionary → Favorites).
   * When `returnTo` is set, stack is only [screen] so Back uses the origin.
   */
  resetStack?: boolean;
  /** Cross-tab origin (e.g. Main) — Header / Telegram Back return here. */
  returnTo?: NavReturnPoint;
};

type AnyNavigation = NavigationProp<ParamListBase> & {
  getParent?: () => AnyNavigation | undefined;
};

function getRootNavigation(navigation: AnyNavigation): AnyNavigation {
  let current = navigation;
  let parent = current.getParent?.();
  while (parent) {
    current = parent;
    parent = current.getParent?.();
  }
  return current;
}

/**
 * Open a screen inside a tab without inheriting a stale nested history
 * (e.g. Library still sitting on CardsDictionary after leaving the tab).
 */
export function createNavigateInTabAction({
  tab,
  screen,
  params,
  resetStack = true,
  returnTo,
}: NavigateInTabOptions) {
  return (state: NavigationState) => {
    if (returnTo) {
      setNavReturn(returnTo);
    }

    const tabIndex = state.routes.findIndex((route) => route.name === tab);

    if (tabIndex < 0 || !resetStack) {
      return CommonActions.navigate({
        name: tab,
        params: params ? { screen, params } : { screen },
      });
    }

    const root = TAB_ROOT_SCREEN[tab];
    const nestedRoutes =
      returnTo || screen === root
        ? [params ? { name: screen, params } : { name: screen }]
        : [
            { name: root },
            params ? { name: screen, params } : { name: screen },
          ];

    const routes = state.routes.map((route, index) => {
      if (index !== tabIndex) {
        return route;
      }

      return {
        ...route,
        state: {
          routes: nestedRoutes,
          index: nestedRoutes.length - 1,
        },
      };
    });

    return CommonActions.reset({
      ...state,
      routes,
      index: tabIndex,
    });
  };
}

/** Dispatch from any nested screen — always targets the root tab navigator. */
export function navigateInTab(
  navigation: AnyNavigation,
  options: NavigateInTabOptions
) {
  getRootNavigation(navigation).dispatch(createNavigateInTabAction(options));
}
