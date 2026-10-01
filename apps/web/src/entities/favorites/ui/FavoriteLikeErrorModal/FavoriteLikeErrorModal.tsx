import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { useTranslation } from 'react-i18next';
import { HeartIcon } from 'shared/icons';
import { useData } from 'shared/DataProvider';
import { DS_COLORS } from 'shared/themes/ds';
import { ModalsContext } from 'shared/ui/ModalsProvider';
import { Button } from 'shared/ui/Button';
import { DsModalSheet } from 'shared/ui/DsModalSheet';
import { Text, TEXT_TAGS } from 'shared/ui/Text';

function FavoriteLikeErrorModal() {
  const { t } = useTranslation('core');

  const { closeModal } = useData({ Context: ModalsContext });
  const { handleVibrationClick } = useData({
    Context: ApplicationConfigContext,
  });

  const handleClose = useCallback(async () => {
    await handleVibrationClick?.();
    closeModal?.();
  }, [closeModal, handleVibrationClick]);

  return (
    <DsModalSheet
      onClose={handleClose}
      closeAccessibilityLabel={t('stub.emptyResultsModal.closeBackdrop')}
      maxWidth={400}
      contentStyle={styles.sheet}
    >
      <View style={styles.iconWrap}>
        <HeartIcon
          width={40}
          height={40}
          stroke={DS_COLORS.accent400}
          strokeWidth={1.8}
          fill={DS_COLORS.ground700}
        />
      </View>
      <Text category={TEXT_TAGS.h3} style={styles.title}>
        {t('card.favoriteError.title')}
      </Text>
      <Text category={TEXT_TAGS.p1} style={styles.subtitle}>
        {t('card.favoriteError.body')}
      </Text>
      <Button style={styles.button} onPress={handleClose}>
        {t('stub.emptyResultsModal.button')}
      </Button>
    </DsModalSheet>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: DS_COLORS.ground800,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 24,
    gap: 14,
    alignItems: 'center',
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: DS_COLORS.ground700,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: DS_COLORS.ground600,
  },
  title: {
    textAlign: 'center',
    color: DS_COLORS.ink50,
  },
  subtitle: {
    textAlign: 'center',
    color: DS_COLORS.ink100,
    lineHeight: 22,
  },
  button: {
    width: '100%',
    marginTop: 4,
  },
});

export default FavoriteLikeErrorModal;
