import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { SpreadContext } from 'entities/Spread';
import { useTranslation } from 'react-i18next';
import { Header } from 'features/header';
import { TarotCardReadingsSpread } from 'features/TarotCardReadings';
import { useData } from 'shared/DataProvider';
import { CopyIcon } from 'shared/icons';
import { isTablet } from 'shared/lib';
import { ScreenLayout } from 'shared/ui';

function SpreadReadings() {
  const route = useRoute<any>();
  const { cardIndex } = route.params || {};
  const { spread, handleCopySpreadInterpretation } = useData({
    Context: SpreadContext,
  });

  const { handleVibrationClick } = useData({
    Context: ApplicationConfigContext,
  });

  const { t } = useTranslation();

  const handlePressCopy = useCallback(async () => {
    await handleVibrationClick?.();

    handleCopySpreadInterpretation?.();
  }, [handleVibrationClick, handleCopySpreadInterpretation]);

  return (
    <ScreenLayout>
      <View style={styles.headerWrap}>
        <Header
          title={t(spread?.name ?? '')}
          rightContent={
            <CopyIcon width={isTablet ? 32 : 24} height={isTablet ? 32 : 24} />
          }
          rightAction={spread?.interpretation ? handlePressCopy : undefined}
        />
      </View>
      <View style={styles.contentWrap}>
        <TarotCardReadingsSpread cardIndex={cardIndex} />
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  headerWrap: {
    paddingRight: 16,
    zIndex: 3,
  },
  contentWrap: {
    flex: 1,
    position: 'relative',
    zIndex: 2,
  },
});

export default SpreadReadings;
