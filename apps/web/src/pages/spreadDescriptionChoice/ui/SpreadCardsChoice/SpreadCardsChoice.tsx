import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import AppMetrica from '@appmetrica/react-native-analytics';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { SpreadContext } from 'entities/Spread';
import { UserContext } from 'entities/user';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import {
  AnimatedCard,
  AnimationCarouselContext,
  CoverFlowCardCarousel,
  useAnimationCarousel,
} from 'features/carousel';
import { Header } from 'features/header';
import { useSpreadCatalogBack } from 'features/header/useSpreadCatalogBack';
import { SignInForSpreadsModal } from 'features/tarotAccess/ui';
import { Question } from 'features/Question';
import { SpreadScheme } from 'features/scheme';
import { SpreadName } from 'shared/api';
import { DataProvider, useData } from 'shared/DataProvider';
import { useNativeNavigation } from 'shared/hooks';
import { ChoiceTriangle } from 'shared/icons';
import {
  AsyncMemoryKey,
  getImage,
  getTodayISO,
  getValueForAsyncDeviceMemoryKey,
  isGuestFreeSpreadId,
  isTablet,
  isWebAuthPending,
  MetrikaGoal,
  reachMetrikaGoal,
  shouldPromptWebSignIn,
  verticalScale,
} from 'shared/lib';
import { COLORS } from 'shared/themes';
import { AnalyticAction, NavigationRoute } from 'shared/types';
import { Button, ScreenLayout, Text, TEXT_TAGS } from 'shared/ui';
import { ModalsContext } from 'shared/ui/ModalsProvider';
import { spreadInnerStyles } from 'shared/lib/spreadInnerUi';
import { CardDescription } from '../CardDescription';
import SpreadStepper from '../SpreadStepper/SpreadStepper';

const PHONE_MAX_WIDTH = 640;

type SpreadCardsChoiceProps = {
  isSimpleSpread?: boolean;
};

function SpreadCardsChoice({
  isSimpleSpread,
}: SpreadCardsChoiceProps) {
  const autoInterpretAttempted = useRef(false);
  const [hasAskedQuestion, setHasAskedQuestion] = useState(false);
  const [simpleInterpretFailed, setSimpleInterpretFailed] = useState(false);

  const { handleVibrationClick } = useData({
    Context: ApplicationConfigContext,
  });

  const navigation = useNativeNavigation();
  const handleBackToSpreads = useSpreadCatalogBack();
  const { t } = useTranslation();
  const { width, height: windowHeight } = useWindowDimensions();
  const isPhone = width < PHONE_MAX_WIDTH;

  const {
    spread,
    isSpreadCompleted,
    checkErrors,
    question,
    interpretationLoading,
    handleGetAIInterpretation,
  } = useData({
    Context: SpreadContext,
  });

  const { isPractitioner, isAuthenticated, authSessionLoading } = useData({
    Context: UserContext,
  });

  const { showModal } = useData({ Context: ModalsContext });

  const animationCarouselContextData = useAnimationCarousel();

  const showCardPicker =
    spread?.id === SpreadName.Simple_DaySuggest ||
    !isSimpleSpread ||
    hasAskedQuestion;

  const handlePressMakeSpread = useCallback(async () => {
    if (
      shouldPromptWebSignIn(isAuthenticated, authSessionLoading) &&
      spread &&
      !isGuestFreeSpreadId(spread.id)
    ) {
      showModal?.(<SignInForSpreadsModal />);
      return;
    }

    let isLocked = false;
    if (Platform.OS !== 'web') {
      const currentAmountSpreads = await getValueForAsyncDeviceMemoryKey<
        Record<string, string>
      >(AsyncMemoryKey.LimitOfSpreads);
      isLocked =
        !isPractitioner &&
        Number(currentAmountSpreads?.[getTodayISO()] ?? '0') >= 10;
    }

    AppMetrica.reportEvent(AnalyticAction.ClickMakeSpread, {
      spread: spread?.name,
      question,
      isLocked: isPractitioner ? false : isLocked,
    });

    await handleVibrationClick?.();

    if (!isPractitioner && isLocked) {
      showModal?.(<SignInForSpreadsModal />);
      return;
    }

    const validation = checkErrors?.() ?? {};
    if (validation.question) {
      Toast.show({
        type: 'error',
        text1: t('spread:question.error'),
      });
      return;
    }

    reachMetrikaGoal(MetrikaGoal.spreadStarted, {
      spreadId: spread?.id,
    });

    setHasAskedQuestion(true);
  }, [
    spread?.id,
    spread?.name,
    question,
    isPractitioner,
    isAuthenticated,
    authSessionLoading,
    checkErrors,
    showModal,
    handleVibrationClick,
    t,
  ]);

  const handleNavigateToSpreadReading = useCallback(async () => {
    if (spread) {
      AppMetrica.reportEvent(AnalyticAction.ClickCompleteSpread, {
        spread: spread?.name,
      });
      reachMetrikaGoal(MetrikaGoal.spreadCompleted, {
        spreadId: spread.id,
      });
      if (
        isGuestFreeSpreadId(spread.id) &&
        shouldPromptWebSignIn(isAuthenticated, authSessionLoading)
      ) {
        reachMetrikaGoal(MetrikaGoal.guestFreeSpread, {
          spreadId: spread.id,
        });
      }
    }

    const ok = (await handleGetAIInterpretation?.()) ?? false;
    if (!ok) {
      if (isSimpleSpread && !isWebAuthPending(authSessionLoading)) {
        setSimpleInterpretFailed(true);
      }
      return;
    }

    setSimpleInterpretFailed(false);
    // @ts-expect-error wrong route
    navigation.navigate(NavigationRoute.SpreadReadings);
  }, [
    handleGetAIInterpretation,
    navigation,
    spread,
    isAuthenticated,
    authSessionLoading,
    isSimpleSpread,
  ]);

  useEffect(() => {
    autoInterpretAttempted.current = false;
    setSimpleInterpretFailed(false);
  }, [spread?.id]);

  useEffect(() => {
    if (!isSpreadCompleted || !isSimpleSpread) {
      return;
    }
    if (isWebAuthPending(authSessionLoading)) {
      return;
    }
    if (autoInterpretAttempted.current) {
      return;
    }
    autoInterpretAttempted.current = true;
    void handleNavigateToSpreadReading();
  }, [
    isSpreadCompleted,
    isSimpleSpread,
    authSessionLoading,
    handleNavigateToSpreadReading,
  ]);

  const handleRetrySimpleInterpret = useCallback(() => {
    setSimpleInterpretFailed(false);
    void handleNavigateToSpreadReading();
  }, [handleNavigateToSpreadReading]);

  const stepperStep = isSpreadCompleted && !isSimpleSpread ? 3 : 2;

  return (
    <ScreenLayout>
      <Header
        backAction={handleBackToSpreads}
        title={t(spread?.name ?? '') ?? 'Выбор карт'}
      />
      {!isSimpleSpread && <SpreadStepper activeStep={stepperStep} />}
      <DataProvider
        Context={AnimationCarouselContext}
        value={animationCarouselContextData}
      >
          <ScrollView
            style={{ flex: 1, position: 'relative' }}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
          <View
            style={[
              styles.wrapper,
              !isSimpleSpread && !isSpreadCompleted && styles.spreadPickWrapper,
              !isSimpleSpread &&
                !isSpreadCompleted &&
                !isPhone && { minHeight: Math.max(420, windowHeight - 220) },
            ]}
          >
            {isSpreadCompleted && !isSimpleSpread ? (
              <View style={spreadInnerStyles.completionPanel}>
                <ChoiceTriangle width={56} height={56} />
                <Text
                  category={TEXT_TAGS.h4}
                  weight="bold"
                  style={spreadInnerStyles.completionTitle}
                >
                  {t('spread:flow.completedTitle')}
                </Text>
                <Button
                  style={[styles.button, spreadInnerStyles.stickyCta]}
                  onPress={handleNavigateToSpreadReading}
                >
                  {t('core:choice.completed')}
                </Button>
              </View>
            ) : (
              <>
                {isSimpleSpread &&
                  spread?.id !== SpreadName.Simple_DaySuggest &&
                  !hasAskedQuestion && (
                    <Image
                      style={styles.image}
                      source={getImage([
                        'spreads',
                        'flatIllustration',
                        spread?.id ?? 'simple_YesNo',
                      ])}
                    />
                  )}
                {showCardPicker ? (
                  <View
                    style={styles.spreadPickCluster}
                    {...(Platform.OS === 'web'
                      ? ({ 'data-tarot-fly-stage': true } as object)
                      : {})}
                  >
                    {/* Scheme sits with carousel (not under stepper) so fly targets are nearby */}
                    {!isSimpleSpread && (
                      <View style={[spreadInnerStyles.glassPanel, styles.schemeInline]}>
                        <SpreadScheme hasRotation={false} isChoicePage />
                      </View>
                    )}
                    {isSimpleSpread && (
                      <View style={styles.simpleIntro}>
                        {!!spread?.description && (
                          <Text
                            category={TEXT_TAGS.p2}
                            style={spreadInnerStyles.descriptionText}
                          >
                            {t(spread.description)}
                          </Text>
                        )}
                        {!!question && (
                          <Text category={TEXT_TAGS.h4} style={styles.questionEcho}>
                            {question}
                          </Text>
                        )}
                      </View>
                    )}
                    <AnimatedCard />
                    <View style={spreadInnerStyles.altarZone}>
                      <View style={spreadInnerStyles.altarGlowClip} pointerEvents="none">
                        <View style={spreadInnerStyles.altarGlow} />
                      </View>
                      <CoverFlowCardCarousel
                        style={
                          isSimpleSpread
                            ? styles.carouselSimpleSpread
                            : styles.carousel
                        }
                      />
                      <Text category={TEXT_TAGS.p2} style={spreadInnerStyles.altarHint}>
                        {t('spread:flow.pickHint')}
                      </Text>
                      {isSimpleSpread &&
                        isSpreadCompleted &&
                        (simpleInterpretFailed || interpretationLoading) && (
                          <View style={styles.simpleRetryPanel}>
                            {interpretationLoading ? (
                              <ActivityIndicator color={COLORS.Primary} />
                            ) : (
                              <Button
                                style={spreadInnerStyles.stickyCta}
                                onPress={handleRetrySimpleInterpret}
                              >
                                {t('core:ai.retry')}
                              </Button>
                            )}
                          </View>
                        )}
                    </View>
                  </View>
                ) : (
                  <View style={[spreadInnerStyles.glassPanel, styles.questionWrapper]}>
                    <Text style={spreadInnerStyles.sectionLabel}>
                      {t('spread:flow.questionSection')}
                    </Text>
                    <Question />
                    {interpretationLoading ? (
                      <ActivityIndicator color={COLORS.Primary} />
                    ) : (
                      <Button
                        style={spreadInnerStyles.stickyCta}
                        onPress={handlePressMakeSpread}
                      >
                        {t('core:button.makeSpread')}
                      </Button>
                    )}
                  </View>
                )}
              </>
            )}
            <CardDescription style={styles.description} />
          </View>
          </ScrollView>
      </DataProvider>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  questionWrapper: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    alignItems: 'stretch',
    gap: 14,
    marginHorizontal: 16,
  },
  wrapper: {
    flexGrow: 1,
    marginBottom: 48,
    gap: 16,
  },
  spreadPickWrapper: {
    justifyContent: 'center',
    gap: 12,
  },
  spreadPickCluster: {
    width: '100%',
    alignItems: 'center',
    gap: 10,
    position: 'relative',
    overflow: 'visible',
  },
  description: {
    marginTop: 8,
    marginHorizontal: 16,
  },
  image: {
    width: '100%',
    height: isTablet ? verticalScale(320) : verticalScale(260),
    marginHorizontal: 16,
    borderRadius: 20,
    opacity: 0.85,
    borderWidth: 1,
    borderColor: 'rgba(173, 173, 177, 0.2)',
  },
  button: { width: '100%' },
  schemeInline: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    marginHorizontal: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    overflow: 'hidden',
    zIndex: 2,
    ...Platform.select({
      web: { isolation: 'isolate' } as object,
      default: {},
    }),
  },
  carousel: {
    marginTop: 4,
    alignSelf: 'center',
  },
  carouselSimpleSpread: {
    marginTop: 0,
    alignSelf: 'center',
  },
  simpleIntro: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    paddingHorizontal: 20,
    gap: 10,
  },
  questionEcho: {
    textAlign: 'center',
    color: COLORS.Content,
  },
  simpleRetryPanel: {
    width: '100%',
    maxWidth: 320,
    alignSelf: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    zIndex: 20,
  },
});

export default SpreadCardsChoice;
