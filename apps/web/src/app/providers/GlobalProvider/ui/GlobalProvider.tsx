import { ReactNode, useEffect, useMemo } from 'react';
import { Platform } from 'react-native';
import { FavoritesContext, useFavorites } from 'entities/favorites';
import { HabitsContext, useHabits } from 'entities/habits';
import { MotivationContext, useMotivation } from 'entities/tarotMotivation';
import { setBackgroundColorAsync } from 'expo-navigation-bar';
import * as ScreenOrientation from 'expo-screen-orientation';
import { PaymentContext, usePayment } from 'features/payment';
import type { TPaymentHookResult } from 'features/payment/model/types';
import {
  TabsAndRoutesContext,
  useTabsAndRoutes,
} from 'shared/contexts/TabsAndRoutes';
import { DataProvider, MultiProvider } from 'shared/DataProvider';
import { preloadWebRoutes } from 'shared/lib/web/preloadWebRoutes';
import { COLORS } from 'shared/themes';
import { SlowConnectionBanner } from 'shared/ui/SlowConnectionBanner';
import {
  ModalContainer,
  ModalsContext,
  useModals,
} from 'shared/ui/ModalsProvider';
import { BusinessComponent } from './BusinessComponent';

type GlobalProviderProps = {
  children: ReactNode;
};

const WEB_PAYMENT_STUB: TPaymentHookResult = {
  offerings: null,
  isLoading: false,
  handleRestorePurchase: async () => undefined,
  handlePurchase: async () => undefined,
};

function GlobalProvider({ children }: GlobalProviderProps) {
  const modalsContextData = useModals();

  const tabsAndRoutesContextData = useTabsAndRoutes();

  const favoritesContextData = useFavorites();

  const habitsContextData = useHabits();

  const motivationContextData = useMotivation();

  /** RevenueCat IAP — native only. Web monetization is Lava credits. */
  const nativePayment = usePayment({
    closeModal: modalsContextData.closeModal,
  });

  const paymentContextData = useMemo(
    () => (Platform.OS === 'web' ? WEB_PAYMENT_STUB : nativePayment),
    [nativePayment]
  );

  useEffect(() => {
    setBackgroundColorAsync(COLORS.Background2);
  }, []);

  useEffect(() => {
    preloadWebRoutes();
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    const lockOrientation = async () => {
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP
      );
    };

    lockOrientation();
  }, []);

  return (
    <MultiProvider
      providers={[
        <DataProvider
          Context={FavoritesContext}
          value={favoritesContextData}
          key=" FavoritesContext"
        />,
        <DataProvider
          Context={MotivationContext}
          value={motivationContextData}
          key=" FavoritesContext"
        />,
        <DataProvider
          Context={ModalsContext}
          value={modalsContextData}
          key="ModalsContext"
        />,
        <DataProvider
          Context={TabsAndRoutesContext}
          value={tabsAndRoutesContextData}
          key="TabsAndRoutesContext"
        />,
        <DataProvider
          Context={PaymentContext}
          value={paymentContextData}
          key="PaymentContext"
        />,
        <DataProvider
          Context={HabitsContext}
          value={habitsContextData}
          key="HabitsContext"
        />,
      ]}
    >
      <SlowConnectionBanner />
      {children}
      <BusinessComponent />
      <ModalContainer />
    </MultiProvider>
  );
}

export default GlobalProvider;
