import { useContext } from 'react';
import { NavigationContext } from '@react-navigation/core';
import type { NavigationProp, ParamListBase } from '@react-navigation/native';
import { SpreadContext } from 'entities/Spread';
import { TabsAndRoutesContext } from 'shared/contexts/TabsAndRoutes';
import { useData } from 'shared/DataProvider';
import { NavigationRoute } from 'shared/types';
import { getNavigationRules } from './getNavigationRules';

type THeaderNavigationParameters = {
  showBackButton?: boolean;
  backAction?: () => void;
};

type THeaderNavigationHookResult = {
  handleBackPress: () => void;
};

export function useHeaderNavigation({
  backAction,
  showBackButton,
}: THeaderNavigationParameters): THeaderNavigationHookResult {
  // Use NavigationContext directly (from @react-navigation/core) instead of
  // useNavigation() / useNavigationState() — those two hooks throw when called
  // outside a Navigator (e.g. inside a modal overlay that is a sibling of the
  // navigator tree). useContext() safely returns undefined in that case.
  const navContext = useContext(NavigationContext) as
    | NavigationProp<ParamListBase>
    | undefined;

  const state = navContext?.getState();

  const { spread } = useData({ Context: SpreadContext });
  const { selectedTab } = useData({ Context: TabsAndRoutesContext });

  const selectedRoute = state?.routes?.[state?.index ?? 0]
    ?.name as NavigationRoute;

  const handleBackPress = () => {
    if (!showBackButton) {
      return;
    }

    if (backAction) {
      backAction();
      return;
    }

    if (!navContext) {
      return;
    }

    const navigationRules = getNavigationRules({
      spread,
      selectedRoute,
      selectedTab,
    });

    if (!navigationRules) {
      navContext.goBack();
      return;
    }

    navContext.navigate(navigationRules.tabRoute as any, {
      screen: navigationRules.navigationRoute,
      params: navigationRules.params,
    });
  };

  return {
    handleBackPress,
  };
}
