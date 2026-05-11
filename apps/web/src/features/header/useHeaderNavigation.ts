import { SpreadContext } from 'entities/Spread';
import { SpreadName } from 'shared/api';
import { TabsAndRoutesContext } from 'shared/contexts/TabsAndRoutes';
import { useData } from 'shared/DataProvider';
import { useNativeNavigation } from 'shared/hooks';
import { NavigationRoute, TabRoute } from 'shared/types';
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
  const navigation = useNativeNavigation();

  const router = useNativeNavigation();

  const state = navigation.getState?.();

  const { spread } = useData({ Context: SpreadContext });
  const { selectedTab } = useData({ Context: TabsAndRoutesContext });

  const selectedRoute = state?.routes?.[state?.index ?? 0]?.name as unknown as
    | NavigationRoute
    | undefined;

  // Обработчик нажатия на кнопку "Назад"
  const handleBackPress = () => {
    if (!showBackButton) {
      return;
    }

    if (backAction) {
      backAction();

      return;
    }

    const navigationRules = getNavigationRules({
      spread,
      selectedRoute,
      selectedTab,
    });

    if (!navigationRules) {
      if (
        spread?.id === SpreadName.Simple_DaySuggest &&
        selectedTab === TabRoute.MainTab
      ) {
        navigation.navigate(TabRoute.MainTab, {
          screen: NavigationRoute.Main,
        });

        return;
      }

      router.goBack(); // Возвращаемся назад по умолчанию

      return;
    }

    navigation.navigate(navigationRules.tabRoute, {
      screen: navigationRules.navigationRoute,
      params: navigationRules.params,
    });
  };

  return {
    handleBackPress,
  };
}
