import { useCallback } from 'react';
import { SpreadContext } from 'entities/Spread';
import { SpreadName, SpreadsCategory } from 'shared/api';
import { TabsAndRoutesContext } from 'shared/contexts/TabsAndRoutes';
import { useData } from 'shared/DataProvider';
import { useNativeNavigation } from 'shared/hooks';
import { NavigationRoute, TabRoute } from 'shared/types';

const SPREAD_FLOW_ROUTES = new Set<string>([
  NavigationRoute.SpreadReadings,
  NavigationRoute.SpreadDescriptionChoice,
]);

export function useSpreadCatalogBack() {
  const navigation = useNativeNavigation();
  const { selectedTab } = useData({ Context: TabsAndRoutesContext });
  const { spread } = useData({ Context: SpreadContext });

  return useCallback(() => {
    const state = navigation.getState();
    const routes = state?.routes ?? [];
    const index = state?.index ?? 0;
    const previousRoute =
      index > 0 ? (routes[index - 1]?.name as string | undefined) : undefined;

    if (previousRoute === NavigationRoute.Spreads) {
      navigation.goBack();
      return;
    }

    if (previousRoute && SPREAD_FLOW_ROUTES.has(previousRoute)) {
      navigation.goBack();
      return;
    }

    const spreadsTab =
      selectedTab === TabRoute.SpreadsTab ? TabRoute.SpreadsTab : TabRoute.MainTab;

    if (
      spread?.id === SpreadName.Simple_DaySuggest &&
      previousRoute === NavigationRoute.Main
    ) {
      navigation.navigate(TabRoute.MainTab, { screen: NavigationRoute.Main });
      return;
    }

    if (spread?.category) {
      navigation.navigate(spreadsTab, {
        screen: NavigationRoute.Spreads,
        params: { id: spread.category as SpreadsCategory },
      });
      return;
    }

    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate(spreadsTab, { screen: NavigationRoute.Spreads });
  }, [navigation, selectedTab, spread?.category, spread?.id]);
}
