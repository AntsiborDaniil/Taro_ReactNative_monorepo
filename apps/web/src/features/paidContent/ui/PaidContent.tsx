import React, { ReactElement, useEffect } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import AppMetrica from '@appmetrica/react-native-analytics';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { UserContext } from 'entities/user';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from 'features/header';
import { PaymentContext } from 'features/payment';
import { useData } from 'shared/DataProvider';
import {
  CardsVoid,
  Infinity as InfinityIcon,
  LeafIcon,
  PlanetIcon,
  UnlockIcon,
} from 'shared/icons';
import { COLORS } from 'shared/themes';
import { AnalyticAction } from 'shared/types';
import { RadioCard, Text, TEXT_TAGS } from 'shared/ui';
import { ModalsContext } from 'shared/ui/ModalsProvider';

type TAdvantage = {
  id: string;
  Icon: ReactElement;
  title: string;
};

const DEFAULT_CHECKED_ID = '$rc_weekly';

function PaidContent() {
  const [checkedId, setCheckedId] = React.useState<string>(DEFAULT_CHECKED_ID);

  const { t } = useTranslation(['subscriptions']);

  const insets = useSafeAreaInsets();

  const { handleVibrationClick } = useData({
    Context: ApplicationConfigContext,
  });

  const { isPractitioner, customerInfo } = useData({
    Context: UserContext,
  });

  const { handleRestorePurchase, isLoading, handlePurchase, offerings } =
    useData({
      Context: PaymentContext,
    });

  const activeOffering = customerInfo?.entitlements.active['pro'];

  const { closeModal } = useData({ Context: ModalsContext });

  const advantages: TAdvantage[] = [
    // {
    //   id: '1',
    //   Icon: <UnlockIcon fill={COLORS.Content} />,
    //   title: t('subscriptionModal.benefits.allSpreads'),
    // },
    // {
    //   id: '2',
    //   Icon: <InfinityIcon width={40} height={40} fill={COLORS.Content} />,
    //   title: t('subscriptionModal.benefits.zeroLimits'),
    // },
    {
      id: '3',
      Icon: <CardsVoid />,
      title: t('subscriptionModal.benefits.design'),
    },
    {
      id: '4',
      Icon: <PlanetIcon fill={COLORS.Content} />,
      title: t('subscriptionModal.benefits.summary'),
    },
    {
      id: '5',
      Icon: <LeafIcon fill={COLORS.Content} />,
      title: t('subscriptionModal.benefits.freePeriod'),
    },
  ];

  const opacityProgress = useSharedValue(0);

  const animatedGradient = useAnimatedStyle(() => {
    return {
      opacity: withTiming(opacityProgress.value, { duration: 300 }),
    };
  });

  useEffect(() => {
    if (opacityProgress.value === 1) {
      return;
    }

    opacityProgress.value = withTiming(1, { duration: 500 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    AppMetrica.reportEvent(AnalyticAction.ShowPaidContent);
  }, []);

  return (
    <SafeAreaView style={styles.modalOverlayWrapper}>
      {isLoading ? (
        <ActivityIndicator
          style={{
            top:
              (Dimensions.get('window').height - insets.top - insets.bottom) /
                2 -
              18,
          }}
          size="large"
          color={COLORS.Primary}
        />
      ) : (
        <>
          <Animated.View style={[styles.gradientWrapper, animatedGradient]}>
            <LinearGradient
              colors={[COLORS.Background, COLORS.Accent]}
              style={styles.gradient}
              locations={[0.15, 0.9]}
            />
          </Animated.View>
          <View style={styles.modalOverlay}>
            <Header
              stylesWrapper={styles.stylesWrapper}
              title={''}
              rightContent={
                isPractitioner ? null : (
                  <Text category={TEXT_TAGS.h4}>
                    {t('subscriptionModal.restore')}
                  </Text>
                )
              }
              backAction={closeModal}
              rightAction={isPractitioner ? null : handleRestorePurchase}
            />
            {isPractitioner && activeOffering?.isActive && (
              <Text style={styles.subStatus}>
                {`${t(activeOffering.willRenew ? 'subscriptionModal.subStatus.willRenew' : 'subscriptionModal.subStatus.notRenew')}${activeOffering.expirationDate ? ` ${new Date(activeOffering.expirationDate).toLocaleDateString()}` : ''}`}
              </Text>
            )}
            <ScrollView style={styles.content}>
              <Text style={styles.h1} category={TEXT_TAGS.h1}>
                {t(
                  isPractitioner
                    ? 'subscriptionModal.practiceTitle'
                    : 'subscriptionModal.title'
                )}
              </Text>

              <View style={styles.paidContent}>
                <View style={styles.paidContentInner}>
                  {advantages.map((item) => (
                    <View key={item.id} style={styles.advantageItem}>
                      {item.Icon}

                      <View style={styles.textContainer}>
                        <Text category={TEXT_TAGS.h4}>{item.title}</Text>
                      </View>
                    </View>
                  ))}

                  <View style={styles.variants}>
                    {offerings?.current?.availablePackages?.reduce(
                      (acc: ReactElement[], item, index, array) => {
                        if (
                          array.length > 1 &&
                          activeOffering &&
                          activeOffering.productIdentifier ===
                            item.product.identifier
                        ) {
                          return acc;
                        }

                        const benefit = index
                          ? 100 -
                            Math.floor(
                              (item.product.pricePerWeek /
                                array[0].product.pricePerWeek) *
                                100
                            )
                          : 0;

                        return [
                          ...acc,
                          <RadioCard
                            title={t(`subscriptionModal.${item.identifier}`)}
                            subtitle={`${item.product.priceString} / ${t(`subscriptionModal.period.${item.identifier}`)}`}
                            key={item.identifier}
                            badgeContent={
                              benefit
                                ? `${t('subscriptionModal.benefit.description1')}${benefit}% ${t('subscriptionModal.benefit.description2')}`
                                : ''
                            }
                            checked={item.identifier === checkedId}
                            onPress={async () => {
                              await handleVibrationClick?.();

                              setCheckedId(item.identifier);
                            }}
                          />,
                        ];
                      },
                      []
                    )}
                  </View>
                </View>
              </View>
            </ScrollView>

            <View style={styles.buttonWrapper}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.continueButton}
                onPress={async () => {
                  await handleVibrationClick?.();
                  await handlePurchase?.(checkedId);
                }}
              >
                <Text category={TEXT_TAGS.h2} style={styles.blackText}>
                  {t(
                    isPractitioner
                      ? 'subscriptionModal.practiceContinue'
                      : 'subscriptionModal.continue'
                  )}
                </Text>
                <Text category={TEXT_TAGS.label} style={styles.greyText}>
                  {t('subscriptionModal.cancel')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  modalOverlayWrapper: {
    backgroundColor: COLORS.Background,
    flex: 1,
    position: 'relative',
    height: '100%',
  },
  content: {
    height: '100%',
  },
  variants: {
    gap: 16,
    paddingBottom: 118,
  },
  gradientWrapper: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  gradient: { width: '100%', height: '100%' },
  modalOverlay: {
    flex: 1,
    position: 'relative',
    alignItems: 'center',
    height: '100%',
  },
  h1: {
    textAlign: 'center',
    marginBottom: 40,
    marginTop: 40,
  },
  subStatus: {
    backgroundColor: COLORS.Primary,
    color: COLORS.Background,
    paddingHorizontal: 4,
    paddingVertical: 6,
    marginTop: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    textAlign: 'center',
  },
  paidContent: {
    position: 'relative',
    backgroundColor: COLORS.Background2,
    borderTopRightRadius: 28,
    borderTopLeftRadius: 28,
    paddingTop: 40,
    width: '100%',
    bottom: 0,
    height: 1000,
    zIndex: 1,
    flex: 1,
  },
  paidContentInner: {
    paddingHorizontal: 16,
  },
  stylesWrapper: {
    paddingRight: 8,
  },
  advantageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 15,
  },
  textContainer: {
    flex: 1,
  },
  buttonWrapper: {
    padding: 16,
    zIndex: 2,
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: COLORS.Background,
    borderTopRightRadius: 44,
    borderTopLeftRadius: 44,
    boxShadow: '0px -10px 10px rgba(255, 255, 255, 0.2)',
  },
  continueButton: {
    width: '100%',
    backgroundColor: COLORS.Primary,
    borderRadius: 28,
    padding: 8,
    alignItems: 'center',
  },
  blackText: {
    color: COLORS.Background,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  greyText: {
    color: COLORS.SpbSky3,
  },
});

export default PaidContent;
