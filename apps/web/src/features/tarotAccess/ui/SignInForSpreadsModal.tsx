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
import { PersonIcon } from 'shared/icons';
import { useData } from 'shared/DataProvider';
import { useNativeNavigation } from 'shared/hooks';
import { COLORS, getColorOpacity } from 'shared/themes';
import { NavigationRoute, TabRoute } from 'shared/types';
import { ModalsContext } from 'shared/ui/ModalsProvider';
import { Button } from 'shared/ui/Button';
import { Text, TEXT_TAGS, TEXT_WEIGHT } from 'shared/ui/Text';

export type SignInForSpreadsModalProps = {
  /** По умолчанию тексты из `spread:`; для настроения — `moodAndEnergy`; для стиля колоды — `settings`. */
  i18nNamespace?: 'spread' | 'moodAndEnergy' | 'settings';
};

function SignInForSpreadsModal({
  i18nNamespace = 'spread',
}: SignInForSpreadsModalProps) {
  const { t } = useTranslation(i18nNamespace);
  const { t: tCore } = useTranslation('core');
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const navigation = useNativeNavigation();

  const { closeModal } = useData({ Context: ModalsContext });
  const { handleVibrationClick } = useData({
    Context: ApplicationConfigContext,
  });

  const handleClose = useCallback(async () => {
    await handleVibrationClick?.();
    closeModal?.();
  }, [closeModal, handleVibrationClick]);

  const goToAccount = useCallback(async () => {
    await handleVibrationClick?.();
    closeModal?.();
    navigation.navigate(TabRoute.LibraryTab, {
      screen: NavigationRoute.Auth,
    });
  }, [closeModal, handleVibrationClick, navigation]);

  const cardMaxW = Math.min(Platform.OS === 'web' ? 360 : 400, width - 32);
  const isWeb = Platform.OS === 'web';

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
        <View style={[styles.inner, isWeb && styles.innerCompact]}>
          <View style={styles.iconWrap}>
            <PersonIcon
              width={isWeb ? 40 : 56}
              height={isWeb ? 40 : 56}
              fill={COLORS.Primary}
            />
          </View>
          <Text
            category={isWeb ? TEXT_TAGS.h4 : TEXT_TAGS.h3}
            style={[styles.title, isWeb && styles.titleCompact]}
          >
            {t('signInRequired.title')}
          </Text>
          <Text
            category={isWeb ? TEXT_TAGS.p2 : TEXT_TAGS.p1}
            style={[styles.subtitle, isWeb && styles.subtitleCompact]}
          >
            {t('signInRequired.body')}
          </Text>
          <Button
            style={[styles.button, isWeb && styles.buttonCompact]}
            onPress={goToAccount}
          >
            <Text
              category={TEXT_TAGS.p2}
              weight={TEXT_WEIGHT.medium}
              style={styles.buttonLabel}
            >
              {t('signInRequired.cta')}
            </Text>
          </Button>
          <Button style={styles.secondary} onPress={handleClose}>
            <Text
              category={TEXT_TAGS.p2}
              weight={TEXT_WEIGHT.regular}
              style={styles.secondaryLabel}
            >
              {tCore('stub.emptyResultsModal.button')}
            </Text>
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
    borderRadius: 20,
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
    borderRadius: 20,
  },
  inner: {
    backgroundColor: COLORS.Background2,
    borderRadius: 18,
    paddingHorizontal: 22,
    paddingVertical: 24,
    alignItems: 'center',
    gap: 10,
  },
  innerCompact: {
    paddingHorizontal: 18,
    paddingVertical: 18,
    gap: 8,
  },
  iconWrap: {
    marginBottom: 4,
  },
  title: {
    textAlign: 'center',
    color: COLORS.Content,
  },
  titleCompact: {
    fontSize: 17,
    lineHeight: 22,
  },
  subtitle: {
    textAlign: 'center',
    color: getColorOpacity(COLORS.Content, 78),
    lineHeight: 22,
  },
  subtitleCompact: {
    fontSize: 13,
    lineHeight: 18,
    maxWidth: 280,
  },
  button: {
    marginTop: 8,
    minWidth: 220,
  },
  buttonCompact: {
    marginTop: 4,
    minWidth: 200,
  },
  buttonLabel: {
    color: COLORS.Content,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  secondary: {
    marginTop: 0,
    backgroundColor: 'transparent',
  },
  secondaryLabel: {
    color: getColorOpacity(COLORS.Content, 88),
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});

export default SignInForSpreadsModal;
