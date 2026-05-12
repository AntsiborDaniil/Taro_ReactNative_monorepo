import { useCallback, useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import AppMetrica from '@appmetrica/react-native-analytics';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { SpreadContext } from 'entities/Spread';
import { UserContext } from 'entities/user';
import { useTranslation } from 'react-i18next';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Header } from 'features/header';
import { DailyTarotLimitModal, SignInForSpreadsModal } from 'features/tarotAccess/ui';
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
  verticalScale,
} from 'shared/lib';
import { COLORS } from 'shared/themes';
import { AnalyticAction } from 'shared/types';
import { Button, NoContent, ScreenLayout, Text, TEXT_TAGS } from 'shared/ui';
import { ModalsContext } from 'shared/ui/ModalsProvider';
import { CardDescription } from './CardDescription';
import { SpreadCardsChoice } from './SpreadCardsChoice';

function SpreadDescriptionChoice() {
  const [isSelectingCards, setIsSelectingCards] = useState<boolean>(false);

  const { t } = useTranslation();

  const { spread, checkErrors, question } = useData({ Context: SpreadContext });

  const { isPractitioner, isAuthenticated, tarotDaily } = useData({
    Context: UserContext,
  });

  const { showModal } = useData({ Context: ModalsContext });

  const { handleVibrationClick } = useData({
    Context: ApplicationConfigContext,
  });

  const handlePressMakeSpread = useCallback(async () => {
    if (
      Platform.OS === 'web' &&
      !isAuthenticated &&
      spread &&
      !isGuestFreeSpreadId(spread.id)
    ) {
      showModal?.(<SignInForSpreadsModal />);
      return;
    }

    let isLocked = false;
    if (Platform.OS === 'web') {
      const used = tarotDaily?.used ?? 0;
      const limit = tarotDaily?.limit ?? 10;
      isLocked =
        Boolean(isAuthenticated) &&
        !!spread &&
        !isGuestFreeSpreadId(spread.id) &&
        used >= limit;
    } else {
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
      showModal?.(<DailyTarotLimitModal />);
      return;
    }

    if (checkErrors?.().question) {
      return;
    }

    setIsSelectingCards(true);
  }, [
    checkErrors,
    isAuthenticated,
    isPractitioner,
    question,
    showModal,
    spread?.name,
    tarotDaily?.limit,
    tarotDaily?.used,
    handleVibrationClick,
    spread?.id,
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
        <Header showBackButton={false} title="" />
        <NoContent
          title={t('core:stub.missingData.title')}
          buttonText={t('core:stub.missingData.button')}
        />
      </ScreenLayout>
    );
  }

  if (isSimpleSpread || isSelectingCards) {
    return <SpreadCardsChoice isSimpleSpread={isSimpleSpread} />;
  }

  return (
    <ScreenLayout>
      <Header showBackButton={false} title="" />
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 48 }}
        enableOnAndroid={true} // Включает поддержку на Android
        extraScrollHeight={100} // Дополнительное пространство для прокрутки
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.wrapper}>
          <SpreadScheme hasRotation={true} />
          <Text style={styles.title} weight="bold" category={TEXT_TAGS.h2}>
            {t(spread.name)}
          </Text>
          <Text style={styles.category}>
            {t(spreadsDataNames[spread.category])}
          </Text>
          <Text>{t(spread.description)}</Text>

          <Question />

          <Button
            style={{ height: verticalScale(46), borderRadius: 32 }}
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
  title: {
    textAlign: 'center',
  },
  category: {
    textAlign: 'center',
    color: COLORS.SpbSky2,
  },
  wrapper: {
    paddingLeft: 16,
    paddingRight: 16,
    paddingBottom: 48,
    gap: moderateScale(16),
  },
});

export default SpreadDescriptionChoice;
