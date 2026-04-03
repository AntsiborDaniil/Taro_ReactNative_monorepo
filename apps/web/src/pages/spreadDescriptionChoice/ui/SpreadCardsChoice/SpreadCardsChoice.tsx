import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';
import AppMetrica from '@appmetrica/react-native-analytics';
import { SpreadContext } from 'entities/Spread';
import { UserContext } from 'entities/user';
import * as Notifications from 'expo-notifications';
import { useTranslation } from 'react-i18next';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import {
  AnimatedCard,
  AnimationCarouselContext,
  CoverFlowCardCarousel,
  useAnimationCarousel,
} from 'features/carousel';
import { Header } from 'features/header';
import { PaidContent } from 'features/paidContent';
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
  isTablet,
  verticalScale,
} from 'shared/lib';
import { COLORS } from 'shared/themes';
import { AnalyticAction, NavigationRoute } from 'shared/types';
import { Button, ScreenLayout } from 'shared/ui';
import { ModalsContext } from 'shared/ui/ModalsProvider';
import { CardDescription } from '../CardDescription';

type SpreadCardsChoiceProps = {
  isSimpleSpread?: boolean;
};

function SpreadCardsChoice({ isSimpleSpread }: SpreadCardsChoiceProps) {
  const attemptsCount = useRef<number>(0);
  const [hasAskedQuestion, setHasAskedQuestion] = useState(false);

  const navigation = useNativeNavigation();
  const { t } = useTranslation();

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

  const { isPractitioner } = useData({ Context: UserContext });

  const { showModal } = useData({ Context: ModalsContext });

  const animationCarouselContextData = useAnimationCarousel();

  const handlePressMakeSpread = useCallback(async () => {
    const currentAmountSpreads = await getValueForAsyncDeviceMemoryKey<
      Record<string, string>
    >(AsyncMemoryKey.LimitOfSpreads);

    const isLocked = Number(currentAmountSpreads?.[getTodayISO()] ?? '0') > 2;

    AppMetrica.reportEvent(AnalyticAction.ClickMakeSpread, {
      spread: spread?.name,
      question,
      isLocked: isPractitioner ? false : isLocked,
    });

    if (!isPractitioner && isLocked) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: t('spread:limit.title'),
          body: t('spread:limit.body'),
        },
        trigger: null,
      });

      showModal?.(<PaidContent />);

      return;
    }

    if (checkErrors?.().question) {
      return;
    }

    setHasAskedQuestion(true);
  }, [spread?.name, question, isPractitioner, checkErrors, t, showModal]);

  const handleNavigateToSpreadReading = useCallback(async () => {
    if (spread) {
      AppMetrica.reportEvent(AnalyticAction.ClickCompleteSpread, {
        spread: spread?.name,
      });
    }

    await handleGetAIInterpretation?.();

    // @ts-expect-error wrong route
    navigation.navigate(NavigationRoute.SpreadReadings);
  }, [handleGetAIInterpretation, navigation, spread]);

  useEffect(() => {
    if (isSpreadCompleted && isSimpleSpread && attemptsCount.current < 1) {
      attemptsCount.current++;
      handleNavigateToSpreadReading();
    }
  }, [isSpreadCompleted, isSimpleSpread, handleNavigateToSpreadReading]);

  return (
    <ScreenLayout>
      <Header title={t(spread?.name ?? '') ?? 'Выбор карт'} />
      <DataProvider
        Context={AnimationCarouselContext}
        value={animationCarouselContextData}
      >
        <KeyboardAwareScrollView
          style={{ flex: 1, position: 'relative' }}
          enableOnAndroid={true} // Включает поддержку на Android
          extraScrollHeight={100} // Дополнительное пространство для прокрутки
        >
          <View style={styles.wrapper}>
            <View style={styles.scheme}>
              <SpreadScheme hasRotation={false} isChoicePage />
            </View>
            {isSpreadCompleted && !isSimpleSpread ? (
              <View style={styles.summary}>
                <ChoiceTriangle width={60} height={60} />
                <Button
                  style={styles.button}
                  onPress={handleNavigateToSpreadReading}
                >
                  {t('core:choice.completed')}
                </Button>
              </View>
            ) : (
              <>
                {isSimpleSpread && (
                  <Image
                    style={styles.image}
                    source={
                      spread?.id === SpreadName.Simple_DaySuggest
                        ? getImage(['core', 'girl'])
                        : getImage([
                            'spreads',
                            'flatIllustration',
                            'simple_YesNo',
                          ])
                    }
                  />
                )}
                <AnimatedCard />
                {spread?.id === SpreadName.Simple_DaySuggest ||
                !isSimpleSpread ||
                hasAskedQuestion ? (
                  <CoverFlowCardCarousel
                    style={
                      isSimpleSpread
                        ? styles.carouselSimpleSpread
                        : styles.carousel
                    }
                  />
                ) : (
                  <View style={styles.questionWrapper}>
                    <Question />
                    {interpretationLoading ? (
                      <ActivityIndicator color={COLORS.Primary} />
                    ) : (
                      <Button
                        style={{
                          height: verticalScale(46),
                          borderRadius: 32,
                        }}
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
  questionWrapper: {
    paddingHorizontal: 12,
    paddingVertical: 20,
    gap: 12,
  },
  wrapper: {
    marginBottom: 48,
  },
  description: {
    marginTop: 24,
    marginLeft: 16,
    marginRight: 16,
  },
  summary: {
    alignItems: 'center',
    padding: 16,
    paddingTop: 30,
    gap: 30,
  },
  image: {
    width: '100%',
    height: isTablet ? verticalScale(450) : verticalScale(380),
    padding: 16,
    borderRadius: 16,
    opacity: 0.7,
  },
  button: { width: '100%', height: verticalScale(46), borderRadius: 32 },
  scheme: { paddingLeft: 16, paddingRight: 16 },
  carousel: { marginTop: 40 },
  carouselSimpleSpread: {
    marginTop: 0,
  },
});

export default SpreadCardsChoice;
