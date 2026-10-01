import { useCallback } from 'react';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CrossIcon } from 'shared/icons';
import { blurActiveElement } from 'shared/lib';
import { DS_COLORS } from 'shared/themes/ds';
import { DsModalSheet, Text, TEXT_TAGS } from 'shared/ui';
import LanguagePickerBody from './LanguagePickerBody';

type LanguagePickerModalProps = {
  visible: boolean;
  onClose: () => void;
};

function LanguagePickerModal({ visible, onClose }: LanguagePickerModalProps) {
  const { t } = useTranslation();

  const handleClose = useCallback(() => {
    blurActiveElement();
    onClose();
  }, [onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <DsModalSheet
        onClose={handleClose}
        closeAccessibilityLabel={t('core:stub.emptyResultsModal.closeBackdrop')}
        maxWidth={420}
      >
        <View style={styles.card} accessibilityViewIsModal>
          <View style={styles.header}>
            <Text category={TEXT_TAGS.h3} style={styles.title}>
              {t('settings:language')}
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={t('core:stub.emptyResultsModal.closeBackdrop')}
              hitSlop={12}
              onPress={handleClose}
            >
              <CrossIcon width={22} height={22} />
            </TouchableOpacity>
          </View>
          <LanguagePickerBody variant="modal" onAfterChange={handleClose} />
        </View>
      </DsModalSheet>
    </Modal>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: DS_COLORS.ground800,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },
  title: {
    flex: 1,
    color: DS_COLORS.ink50,
  },
});

export default LanguagePickerModal;
