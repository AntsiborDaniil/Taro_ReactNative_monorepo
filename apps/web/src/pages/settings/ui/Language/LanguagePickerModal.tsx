import { useCallback } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { CrossIcon } from 'shared/icons';
import { blurActiveElement } from 'shared/lib';
import { COLORS } from 'shared/themes';
import { Text, TEXT_TAGS } from 'shared/ui';
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
      <View style={styles.root} pointerEvents="box-none">
        <Pressable
          style={styles.backdrop}
          accessibilityRole="button"
          accessibilityLabel={t('core:stub.emptyResultsModal.closeBackdrop')}
          onPress={handleClose}
        />
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
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 20,
    backgroundColor: COLORS.Background2,
    borderWidth: 1,
    borderColor: 'rgba(175, 161, 232, 0.25)',
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 12px 48px rgba(0,0,0,0.35)',
        } as object)
      : {}),
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
    color: COLORS.Content,
  },
});

export default LanguagePickerModal;
