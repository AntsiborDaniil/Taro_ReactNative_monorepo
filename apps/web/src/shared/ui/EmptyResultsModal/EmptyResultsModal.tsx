import { useCallback } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CardsVoid } from 'shared/icons';
import { useData } from 'shared/DataProvider';
import { COLORS, getColorOpacity } from 'shared/themes';
import { ModalsContext } from '../ModalsProvider';
import { Button } from '../Button';
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
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const { closeModal } = useData({ Context: ModalsContext });
  const { handleVibrationClick } = useData({
    Context: ApplicationConfigContext,
  });

  const handleClose = useCallback(async () => {
    await handleVibrationClick?.();
    closeModal?.();
  }, [closeModal, handleVibrationClick]);

  const cardMaxW = Math.min(400, width - 32);

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 12,
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('stub.emptyResultsModal.closeBackdrop')}
        style={styles.backdrop}
        onPress={handleClose}
      />
      <View style={[styles.sheet, { maxWidth: cardMaxW }]}>
        <LinearGradient
          colors={[COLORS.Primary500, COLORS.Accent, COLORS.Secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.rim}
        />
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 14, 22, 0.72)',
  },
  sheet: {
    zIndex: 2,
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow:
          '0 24px 48px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.06)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.4,
        shadowRadius: 24,
        elevation: 16,
      },
    }),
  },
  rim: {
    height: 4,
    width: '100%',
  },
  inner: {
    backgroundColor: COLORS.Background2,
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
    backgroundColor: getColorOpacity(COLORS.Primary, 14),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: getColorOpacity(COLORS.Primary, 35),
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    color: getColorOpacity(COLORS.Content, 78),
    lineHeight: 22,
  },
  button: {
    width: '100%',
    marginTop: 4,
    paddingVertical: 12,
  },
});

export default EmptyResultsModal;
