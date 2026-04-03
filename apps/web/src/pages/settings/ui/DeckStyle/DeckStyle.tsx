import { StyleSheet, View } from 'react-native';
import AppMetrica from '@appmetrica/react-native-analytics';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { UserContext } from 'entities/user';
import { useTranslation } from 'react-i18next';
import { Header } from 'features/header';
import { PaidContent } from 'features/paidContent';
import { useData } from 'shared/DataProvider';
import { AsyncMemorySettingKey } from 'shared/lib';
import { AnalyticAction } from 'shared/types';
import { CardsList, ScreenLayout } from 'shared/ui';
import { ModalsContext } from 'shared/ui/ModalsProvider';
import { DECK_STYLES } from '../../lib';
import { useSettings } from '../../model';

function DeckStyle() {
  const { t } = useTranslation();

  const { handleChangeBase } = useSettings({
    hasAutoSave: true,
    asyncMemoryKey: AsyncMemorySettingKey.Appearance,
  });

  const { isPractitioner } = useData({ Context: UserContext });

  const { showModal } = useData({ Context: ModalsContext });

  const { handleVibrationClick } = useData({
    Context: ApplicationConfigContext,
  });

  return (
    <ScreenLayout style={styles.container}>
      <Header title={t('settings:deck.style')} />
      <View style={styles.inner}>
        <CardsList
          hasSelectStatus
          isAllUnlocked={isPractitioner}
          cards={DECK_STYLES}
          onPressLocked={async () => {
            await handleVibrationClick?.();

            showModal?.(<PaidContent />);
          }}
          onPress={async (item) => {
            await handleVibrationClick?.();

            handleChangeBase(item.customAppearance, 'deckStyle');

            AppMetrica.reportEvent(AnalyticAction.ClickChangeDeckStyle, {
              style: item.name,
            });
          }}
        />
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    paddingHorizontal: 16,
  },
});

export default DeckStyle;
