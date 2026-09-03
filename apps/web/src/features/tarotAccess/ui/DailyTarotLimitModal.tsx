import { useCallback, useEffect } from 'react';
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
import { MetrikaGoal, reachMetrikaGoal } from 'shared/lib';
import { useData } from 'shared/DataProvider';
import { COLORS, getColorOpacity } from 'shared/themes';
import { ModalsContext } from 'shared/ui/ModalsProvider';
import { Button } from 'shared/ui/Button';
import { Text, TEXT_TAGS } from 'shared/ui/Text';

function DailyTarotLimitModal() {
  const { t } = useTranslation('spread');
  const { t: tCore } = useTranslation('core');
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const { closeModal } = useData({ Context: ModalsContext });
  const { handleVibrationClick } = useData({
    Context: ApplicationConfigContext,
  });

  useEffect(() => {
    reachMetrikaGoal(MetrikaGoal.dailyLimitHit);
  }, []);

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
        accessibilityLabel={tCore('stub.emptyResultsModal.closeBackdrop')}
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
            {t('dailyLimit.title')}
          </Text>
          <Text category={TEXT_TAGS.p1} style={styles.subtitle}>
            {t('dailyLimit.body')}
          </Text>
          <Button style={styles.button} onPress={handleClose}>
            {tCore('stub.emptyResultsModal.button')}
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
    backgroundColor: getColorOpacity(COLORS.Background, 0.72),
  },
  sheet: {
    zIndex: 2,
    width: '100%',
    borderRadius: 28,
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
    padding: 2,
    borderRadius: 28,
  },
  inner: {
    backgroundColor: COLORS.Background2,
    borderRadius: 26,
    paddingHorizontal: 22,
    paddingVertical: 24,
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    marginBottom: 4,
  },
  title: {
    textAlign: 'center',
    color: COLORS.Content,
  },
  subtitle: {
    textAlign: 'center',
    color: getColorOpacity(COLORS.Content, 78),
    lineHeight: 22,
  },
  button: {
    marginTop: 8,
    minWidth: 200,
  },
});

export default DailyTarotLimitModal;
