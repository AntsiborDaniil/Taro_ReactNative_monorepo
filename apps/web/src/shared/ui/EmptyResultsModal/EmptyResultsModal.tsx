import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { useTranslation } from 'react-i18next';
import { CardsVoid } from 'shared/icons';
import { useData } from 'shared/DataProvider';
import { DS_COLORS } from 'shared/themes/ds';
import { ModalsContext } from '../ModalsProvider';
import { Button } from '../Button';
import { DsModalSheet } from '../DsModalSheet';
import { Text, TEXT_TAGS } from '../Text';

type EmptyResultsModalProps = {
  /** Если задано — вместо стандартного заголовка */
  title?: string;
  /** Если задано — вместо стандартного подзаголовка */
  subtitle?: string;
};

/**
 * Отдельная от платного контента модалка для пустого результата (поиск, фильтр, нет данных).
 */
function EmptyResultsModal({ title, subtitle }: EmptyResultsModalProps) {
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
    >
      <View style={styles.inner}>
        <View style={styles.iconWrap}>
          <CardsVoid width={72} height={72} />
        </View>
        <Text category={TEXT_TAGS.h3} style={styles.title}>
          {title ?? t('stub.emptyResults')}
        </Text>
        <Text category={TEXT_TAGS.p1} style={styles.subtitle}>
          {subtitle ?? t('stub.emptyResultsModal.subtitle')}
        </Text>
        <Button style={styles.button} onPress={handleClose}>
          {t('stub.emptyResultsModal.button')}
        </Button>
      </View>
    </DsModalSheet>
  );
}

const styles = StyleSheet.create({
  inner: {
    backgroundColor: DS_COLORS.ground800,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 22,
    gap: 14,
    alignItems: 'center',
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: DS_COLORS.ground700,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: DS_COLORS.ground600,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    color: DS_COLORS.ink100,
    lineHeight: 22,
  },
  button: {
    width: '100%',
    marginTop: 4,
    paddingVertical: 12,
  },
});

export default EmptyResultsModal;
