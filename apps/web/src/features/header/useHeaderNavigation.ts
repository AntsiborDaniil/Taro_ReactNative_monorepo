import { useNavigationState } from '@react-navigation/native';
import { SpreadContext } from 'entities/Spread';
import { TabsAndRoutesContext } from 'shared/contexts/TabsAndRoutes';
import { useData } from 'shared/DataProvider';
import { useNativeNavigation } from 'shared/hooks';
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
  const navigation = useNativeNavigation();

  const router = useNativeNavigation();

  const state = useNavigationState((state) => state);

  const { spread } = useData({ Context: SpreadContext });
  const { selectedTab } = useData({ Context: TabsAndRoutesContext });

  const selectedRoute = state?.routes?.[state?.index ?? 0]
    ?.name as NavigationRoute;

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
