import { Modal, Platform, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CrossIcon } from 'shared/icons';
import { COLORS } from 'shared/themes';
import { Text, TEXT_TAGS } from 'shared/ui';
import LanguagePickerBody from './LanguagePickerBody';

type LanguagePickerModalProps = {
  visible: boolean;
  onClose: () => void;
};

function LanguagePickerModal({ visible, onClose }: LanguagePickerModalProps) {
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.backdrop}
        accessibilityRole="button"
        accessibilityLabel={t('core:stub.emptyResultsModal.closeBackdrop')}
        onPress={onClose}
      >
        <Pressable
          style={styles.card}
          onPress={(e) => e.stopPropagation()}
          accessibilityViewIsModal
        >
          <View style={styles.header}>
            <Text category={TEXT_TAGS.h3} style={styles.title}>
              {t('settings:language')}
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={t('core:stub.emptyResultsModal.closeBackdrop')}
              hitSlop={12}
              onPress={onClose}
            >
              <CrossIcon width={22} height={22} />
            </TouchableOpacity>
          </View>
          <LanguagePickerBody variant="modal" onAfterChange={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
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
