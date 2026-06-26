import { useCallback, useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import AppMetrica from '@appmetrica/react-native-analytics';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { SpreadContext } from 'entities/Spread';
import { UserContext } from 'entities/user';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import KeyboardAwareScrollView from 'react-native-keyboard-aware-scroll-view';
import { Header } from 'features/header';
import { useSpreadCatalogBack } from 'features/header/useSpreadCatalogBack';
import { SignInForSpreadsModal } from 'features/tarotAccess/ui';
import Question from 'features/Question/ui/Question';
import { SpreadScheme } from 'features/scheme';
import { SpreadsCategory, spreadsDataNames } from 'shared/api';
import { useData } from 'shared/DataProvider';
import {
  AsyncMemoryKey,
  getTodayISO,
  getValueForAsyncDeviceMemoryKey,
  isGuestFreeSpreadId,
  moderateScale,
  shouldPromptWebSignIn,
} from 'shared/lib';
import { AnalyticAction } from 'shared/types';
import { Button, NoContent, ScreenLayout, Text, TEXT_TAGS } from 'shared/ui';
import { ModalsContext } from 'shared/ui/ModalsProvider';
import { spreadInnerStyles } from 'shared/lib/spreadInnerUi';
import { CardDescription } from './CardDescription';
import SpreadHeroBanner from './SpreadHeroBanner/SpreadHeroBanner';
import SpreadStepper from './SpreadStepper/SpreadStepper';
import { SpreadCardsChoice } from './SpreadCardsChoice';

function SpreadDescriptionChoice() {
  const [isSelectingCards, setIsSelectingCards] = useState<boolean>(false);
  const handleBackToSpreads = useSpreadCatalogBack();

  const { t } = useTranslation();

  const { spread, checkErrors, question } = useData({ Context: SpreadContext });

  const { isPractitioner, isAuthenticated, authSessionLoading } = useData({
    Context: UserContext,
  });

  const { showModal } = useData({ Context: ModalsContext });

  const { handleVibrationClick } = useData({
    Context: ApplicationConfigContext,
  });

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
      isLocked: isPractitioner ? false : isLocked,
    });

    await handleVibrationClick?.();

    if (!isPractitioner && isLocked) {
      showModal?.(<SignInForSpreadsModal />);
      return;
    }

    if (checkErrors?.().question) {
      Toast.show({
        type: 'error',
        text1: t('spread:question.error'),
      });
      return;
    }

    setIsSelectingCards(true);
  }, [
    checkErrors,
    isAuthenticated,
    authSessionLoading,
    isPractitioner,
    question,
    showModal,
    spread?.name,
    handleVibrationClick,
    spread?.id,
    t,
  ]);

  const isSimpleSpread = spread?.category === SpreadsCategory.Simple;

  useEffect(() => {
    if (isSimpleSpread) {
      setIsSelectingCards(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!spread) {
    return (
      <ScreenLayout>
        <Header backAction={handleBackToSpreads} title="" />
        <NoContent
          title={t('core:stub.missingData.title')}
          buttonText={t('core:stub.missingData.button')}
        />
      </ScreenLayout>
    );
  }

  if (isSimpleSpread || isSelectingCards) {
    return (
      <SpreadCardsChoice
        isSimpleSpread={isSimpleSpread}
        scrollToPickerOnMount={isSelectingCards && !isSimpleSpread}
      />
    );
  }

  return (
    <ScreenLayout>
      <Header backAction={handleBackToSpreads} title="" />
      <SpreadStepper activeStep={1} />
      <KeyboardAwareScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        enableOnAndroid
        extraScrollHeight={100}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.wrapper}>
          <SpreadHeroBanner
            spread={spread}
            categoryLabel={t(spreadsDataNames[spread.category])}
          />

          <View style={spreadInnerStyles.glassPanel}>
            <Text style={spreadInnerStyles.sectionLabel}>
              {t('spread:flow.positionsTitle')}
            </Text>
            <SpreadScheme hasRotation />
          </View>

          <Text category={TEXT_TAGS.p2} style={spreadInnerStyles.descriptionText}>
            {t(spread.description)}
          </Text>

          <View style={spreadInnerStyles.glassPanel}>
            <Text style={spreadInnerStyles.sectionLabel}>
              {t('spread:flow.questionSection')}
            </Text>
            <Question />
          </View>

          <Button
            style={spreadInnerStyles.stickyCta}
            onPress={handlePressMakeSpread}
          >
            {t('core:button.makeSpread')}
          </Button>

          <CardDescription />
        </View>
      </KeyboardAwareScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 48,
  },
  wrapper: {
    paddingHorizontal: 16,
    gap: moderateScale(18),
  },
});

export default SpreadDescriptionChoice;
