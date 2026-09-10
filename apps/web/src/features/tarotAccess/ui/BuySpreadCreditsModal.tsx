import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { UserContext } from 'entities/user';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CardsVoid, LightningBolt } from 'shared/icons';
import { useData } from 'shared/DataProvider';
import { cloudFetch } from 'shared/api/cloud/cloudFetch';
import { wakeCloudApi } from 'shared/api/cloud/wakeCloudApi';
import { openExternalPaymentUrl } from 'shared/lib/web/telegramWebApp';
import { COLORS, getColorOpacity } from 'shared/themes';
import { ModalsContext } from 'shared/ui/ModalsProvider';
import { Button } from 'shared/ui/Button';
import { Input } from 'shared/ui/Input';
import { Text, TEXT_TAGS } from 'shared/ui/Text';

const SYNTHETIC_TG_EMAIL_RE = /^tg\d+@telegram\.mindful\.app$/i;

type BuySpreadCreditsModalProps = {
  /** Optional title override (settings vs limit modal). */
  titleKey?: string;
  bodyKey?: string;
};

function BuySpreadCreditsModal({
  titleKey = 'credits.buy.title',
  bodyKey = 'credits.buy.body',
}: BuySpreadCreditsModalProps) {
  const { t } = useTranslation('settings');
  const { t: tSpread } = useTranslation('spread');
  const { t: tCore } = useTranslation('core');
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const { closeModal } = useData({ Context: ModalsContext });
  const { handleVibrationClick } = useData({
    Context: ApplicationConfigContext,
  });
  const { authUser, spreadCredits, refreshAuthSession } = useData({
    Context: UserContext,
  });

  const suggestedEmail = useMemo(() => {
    const email = authUser?.email?.trim() || '';
    if (!email || SYNTHETIC_TG_EMAIL_RE.test(email)) {
      return '';
    }
    return email;
  }, [authUser?.email]);

  const [email, setEmail] = useState(suggestedEmail);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEmail(suggestedEmail);
  }, [suggestedEmail]);

  const handleClose = useCallback(async () => {
    await handleVibrationClick?.();
    closeModal?.();
  }, [closeModal, handleVibrationClick]);

  const handleBuy = useCallback(async () => {
    await handleVibrationClick?.();
    setError(null);
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes('@')) {
      setError(tSpread('dailyLimit.emailInvalid'));
      return;
    }

    setBusy(true);
    try {
      await wakeCloudApi();
      const result = await cloudFetch<{ paymentUrl: string }>(
        '/api/payments/lava/checkout',
        {
          method: 'POST',
          body: JSON.stringify({ email: trimmed }),
        }
      );

      if (!result.ok || !result.data?.paymentUrl) {
        if (result.status === 503) {
          setError(tSpread('dailyLimit.buyUnavailable'));
        } else if (result.status === 401) {
          setError(tSpread('dailyLimit.buyUnauthorized'));
        } else {
          const message = !result.ok ? result.message : undefined;
          setError(message || tSpread('dailyLimit.buyFailed'));
        }
        return;
      }

      openExternalPaymentUrl(result.data.paymentUrl);
      void refreshAuthSession?.();
      closeModal?.();
    } finally {
      setBusy(false);
    }
  }, [
    closeModal,
    email,
    handleVibrationClick,
    refreshAuthSession,
    tSpread,
  ]);

  const cardMaxW = Math.min(420, width - 32);
  const credits = spreadCredits ?? 0;

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
          <View style={styles.iconRow}>
            <LightningBolt width={36} height={36} fill={COLORS.Primary500} />
            <CardsVoid width={56} height={56} />
          </View>
          <Text category={TEXT_TAGS.h3} style={styles.title}>
            {t(titleKey)}
          </Text>
          <Text category={TEXT_TAGS.p1} style={styles.subtitle}>
            {t(bodyKey)}
          </Text>
          {credits > 0 ? (
            <Text category={TEXT_TAGS.p2} style={styles.balance}>
              {t('credits.buy.balance', { count: credits })}
            </Text>
          ) : null}

          <View style={styles.emailWrap}>
            <Input
              label={tSpread('dailyLimit.emailLabel')}
              baseInputProps={{
                value: email,
                onChangeText: setEmail,
                autoCapitalize: 'none',
                autoCorrect: false,
                keyboardType: 'email-address',
                placeholder: tSpread('dailyLimit.emailPlaceholder'),
                editable: !busy,
              }}
            />
          </View>

          {error ? (
            <Text category={TEXT_TAGS.p2} style={styles.error}>
              {error}
            </Text>
          ) : null}

          <Button style={styles.button} onPress={handleBuy} disabled={busy}>
            {busy
              ? tSpread('dailyLimit.buyLoading')
              : tSpread('dailyLimit.buyCta')}
          </Button>
          <Button
            style={styles.secondaryButton}
            onPress={handleClose}
            disabled={busy}
          >
            {tSpread('dailyLimit.later')}
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
    backgroundColor: getColorOpacity(COLORS.Background, 72),
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
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  balance: {
    textAlign: 'center',
    color: COLORS.Primary500,
  },
  emailWrap: {
    width: '100%',
    marginTop: 4,
  },
  error: {
    textAlign: 'center',
    color: COLORS.Danger500,
  },
  button: {
    marginTop: 8,
    minWidth: 200,
  },
  secondaryButton: {
    minWidth: 200,
    opacity: 0.85,
  },
});

export default BuySpreadCreditsModal;
