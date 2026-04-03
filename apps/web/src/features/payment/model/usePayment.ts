import { useCallback, useEffect, useState } from 'react';
import { Alert, InteractionManager } from 'react-native';
import AppMetrica from '@appmetrica/react-native-analytics';
import { UserContext } from 'entities/user';
import { useTranslation } from 'react-i18next';
import Purchases, { PurchasesOfferings } from 'react-native-purchases';
import { SubscriptionType } from 'shared/api';
import { useData } from 'shared/DataProvider';
import { useNativeNavigation } from 'shared/hooks';
import { AnalyticAction, NavigationRoute, TabRoute } from 'shared/types';
import { rateAppWithCooldown } from 'shared/utils';
import { TPaymentHookParameters, TPaymentHookResult } from './types';

export function usePayment({
  closeModal,
}: TPaymentHookParameters): TPaymentHookResult {
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { t } = useTranslation(['subscriptions']);

  const { setSubscriptionType } = useData({ Context: UserContext });

  const navigation = useNativeNavigation();

  const handleRestorePurchase = useCallback(async () => {
    try {
      setIsLoading(true);

      const restore = await Purchases.restorePurchases();

      if (restore.activeSubscriptions.length > 0) {
        Alert.alert(
          t('subscriptionModal.successPurchase'),
          t('subscriptionModal.restorePurchaseSuccess')
        );

        setSubscriptionType?.(SubscriptionType.Practice);

        closeModal?.();

        navigation.navigate(TabRoute.MainTab, {
          screen: NavigationRoute.Spreads,
        });
      } else {
        Alert.alert(
          t('subscriptionModal.cancelPurchase'),
          t('subscriptionModal.restorePurchaseCancel')
        );

        setSubscriptionType?.(SubscriptionType.Freemium);
      }
    } catch (error: any) {
      Alert.alert(
        t('subscriptionModal.errorPurchase'),
        t('subscriptionModal.restorePurchaseError')
      );

      AppMetrica.reportError('Subscription restore error', error.message);
    } finally {
      setIsLoading(false);
    }
  }, [closeModal, navigation, setSubscriptionType, t]);

  const handlePurchase = useCallback(
    async (checkedId: string) => {
      const pack = offerings?.current?.availablePackages?.find(
        (item) => item.identifier === checkedId
      );

      if (pack) {
        try {
          setIsLoading(true);

          const { customerInfo } = await Purchases.purchasePackage(pack);

          if (typeof customerInfo?.entitlements.active['pro'] !== 'undefined') {
            setSubscriptionType?.(SubscriptionType.Practice);

            Alert.alert(
              t('subscriptionModal.successPurchase'),
              t('subscriptionModal.successPurchaseDescription')
            );

            closeModal?.();

            navigation.navigate(TabRoute.MainTab, {
              screen: NavigationRoute.Spreads,
            });

            InteractionManager.runAfterInteractions(() => {
              setTimeout(() => {
                rateAppWithCooldown().catch(() => {});
              }, 1000);
            });
          } else {
            setSubscriptionType?.(SubscriptionType.Freemium);

            Alert.alert(
              t('subscriptionModal.errorPurchase'),
              t('subscriptionModal.errorPurchaseNotActivatedDescription')
            );
          }
        } catch (error: any) {
          if (error.userCancelled) {
            setSubscriptionType?.(SubscriptionType.Freemium);
            Alert.alert(
              t('subscriptionModal.cancelPurchase'),
              t('subscriptionModal.cancelPurchaseDescription')
            );

            return;
          }

          Alert.alert(
            t('subscriptionModal.errorPurchase'),
            t('subscriptionModal.errorPurchaseDescription')
          );

          AppMetrica.reportError('Subscription purchase error', error.message);
        } finally {
          setIsLoading(false);
        }
      }

      AppMetrica.reportEvent(AnalyticAction.ClickSubmitPaidContent, {
        id: checkedId,
      });
    },
    [closeModal, navigation, offerings, setSubscriptionType, t]
  );

  useEffect(() => {
    const getOfferings = async () => {
      try {
        setOfferings(await Purchases.getOfferings());
      } catch (e: any) {
        AppMetrica.reportError('Offerings GET error', e.message);
      }
    };

    getOfferings();
  }, []);

  return {
    offerings,
    isLoading,
    handleRestorePurchase,
    handlePurchase,
  };
}
