import AppMetrica from '@appmetrica/react-native-analytics';
import { setNavReturnToMain } from 'app/navigation/navReturnStore';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { SpreadContext } from 'entities/Spread';
import { UserContext } from 'entities/user';
import { TSpread } from 'shared/api';
import { useData } from 'shared/DataProvider';
import { useNativeNavigation } from 'shared/hooks';
import { shouldPromptWebSignIn, toastWebAuthRequired } from 'shared/lib';
import { TabsAndRoutesContext } from 'shared/contexts/TabsAndRoutes';
import { AnalyticAction, NavigationRoute, TabRoute } from 'shared/types';

/**
 * Логика нажатия на карточку расклада — вынесена из
 * features/cards/smallSpreadCard/ui/SmallSpreadCard.tsx один в один (тот
 * компонент не трогаем). Используется локальным MainSpreadCard на главной.
 */
export function useOpenSpread(spread: TSpread, analyticAction?: AnalyticAction) {
  const { name } = spread ?? {};

  const navigation = useNativeNavigation();

  const { handleVibrationClick } = useData({
    Context: ApplicationConfigContext,
  });

  const { isAuthenticated, authSessionLoading, refreshAuthSession } = useData({
    Context: UserContext,
  });

  const { setSelectedTab } = useData({ Context: TabsAndRoutesContext });

  const isLocked = false;

  const { selectSpread } = useData({
    Context: SpreadContext,
  });

  const onPress = async () => {
    if (analyticAction) {
      AppMetrica.reportEvent(analyticAction, {
        spread: name,
        isLocked,
      });
    }

    await handleVibrationClick?.();

    if (shouldPromptWebSignIn(isAuthenticated, authSessionLoading)) {
      void refreshAuthSession?.();
      toastWebAuthRequired();
      return;
    }

    const { shouldRedirectToSpreadReading } =
      (await selectSpread?.(spread)) || {};

    setSelectedTab?.(TabRoute.SpreadsTab);
    setNavReturnToMain();

    if (shouldRedirectToSpreadReading) {
      navigation.navigate(TabRoute.SpreadsTab, {
        screen: NavigationRoute.SpreadReadings,
      });

      return;
    }

    navigation.navigate(TabRoute.SpreadsTab, {
      screen: NavigationRoute.SpreadDescriptionChoice,
    });
  };

  return { onPress };
}
