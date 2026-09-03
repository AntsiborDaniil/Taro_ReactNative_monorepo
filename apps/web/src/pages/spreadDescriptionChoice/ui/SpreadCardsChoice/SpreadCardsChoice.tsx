import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Platform,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppMetrica from '@appmetrica/react-native-analytics';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { SpreadContext } from 'entities/Spread';
import { UserContext } from 'entities/user';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
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
  const attemptsCount = useRef<number>(0);
  const [hasAskedQuestion, setHasAskedQuestion] = useState(false);

  const { handleVibrationClick } = useData({
    Context: ApplicationConfigContext,
  });

  const navigation = useNativeNavigation();
  const handleBackToSpreads = useSpreadCatalogBack();
  const { t } = useTranslation();
  const { width, height: windowHeight } = useWindowDimensions();
  const { bottom } = useSafeAreaInsets();
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
      return;
    }

    // @ts-expect-error wrong route
    navigation.navigate(NavigationRoute.SpreadReadings);
  }, [
    handleGetAIInterpretation,
    navigation,
    spread,
    isAuthenticated,
    authSessionLoading,
  ]);

  useEffect(() => {
    if (isSpreadCompleted && isSimpleSpread && attemptsCount.current < 1) {
      attemptsCount.current++;
      handleNavigateToSpreadReading();
    }
  }, [isSpreadCompleted, isSimpleSpread, handleNavigateToSpreadReading]);

  const isDaySuggest = spread?.id === SpreadName.Simple_DaySuggest;

  if (isDaySuggest) {
    return (
      <ScreenLayout style={styles.daySuggestScreen}>
        <View style={styles.daySuggestRoot}>
          <ImageBackground
            source={getImage(['core', 'girl'])}
            resizeMode="cover"
            style={styles.daySuggestBg}
            imageStyle={styles.daySuggestBgImage}
          >
            <View style={styles.daySuggestScrim} pointerEvents="none" />
            <View style={styles.daySuggestHeader} pointerEvents="box-none">
              <Header
                backAction={handleBackToSpreads}
                title={t(spread?.name ?? '')}
              />
            </View>
            <DataProvider
              Context={AnimationCarouselContext}
              value={animationCarouselContextData}
            >
              <View
                style={[
                  styles.daySuggestCenter,
                  { paddingBottom: bottom + (isPhone ? 12 : 48) },
                ]}
                pointerEvents="box-none"
                {...(Platform.OS === 'web'
                  ? ({ 'data-tarot-fly-stage': true } as object)
                  : {})}
              >
                <AnimatedCard />
                <CoverFlowCardCarousel overlayControls={isPhone} />
              </View>
            </DataProvider>
          </ImageBackground>
        </View>
      </ScreenLayout>
    );
  }

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
        <KeyboardAwareScrollView
          style={{ flex: 1, position: 'relative' }}
          contentContainerStyle={styles.scrollContent}
          enableOnAndroid
          extraScrollHeight={100}
          keyboardShouldPersistTaps="handled"
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
                    <AnimatedCard />
                    <View style={spreadInnerStyles.altarZone}>
                      <View style={spreadInnerStyles.altarGlow} pointerEvents="none" />
                      <CoverFlowCardCarousel
                        style={
                          isSimpleSpread
                            ? styles.carouselSimpleSpread
                            : styles.carousel
                        }
                      />
                      {!isSimpleSpread && (
                        <Text category={TEXT_TAGS.p2} style={spreadInnerStyles.altarHint}>
                          {t('spread:flow.pickHint')}
                        </Text>
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
        </KeyboardAwareScrollView>
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
  },
  carousel: {
    marginTop: 4,
    alignSelf: 'center',
  },
  carouselSimpleSpread: {
    marginTop: 0,
    alignSelf: 'center',
  },
  daySuggestScreen: {
    paddingTop: 0,
    paddingHorizontal: 0,
    gap: 0,
  },
  daySuggestRoot: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: COLORS.Background,
  },
  daySuggestBg: {
    flex: 1,
    width: '100%',
    minHeight: 0,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  daySuggestBgImage: {
    opacity: 0.85,
  },
  daySuggestScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 12, 22, 0.15)',
    zIndex: 0,
  },
  daySuggestHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
  },
  daySuggestCenter: {
    flex: 1,
    width: '100%',
    alignSelf: 'stretch',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    zIndex: 1,
    position: 'relative',
    overflow: 'visible',
  },
});

export default SpreadCardsChoice;
