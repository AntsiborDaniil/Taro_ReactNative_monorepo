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
import {
  MetrikaGoal,
  markAwaitingLavaPayment,
  reachMetrikaGoal,
} from 'shared/lib/web/yandexMetrika';
import { COLORS, getColorOpacity } from 'shared/themes';
import { ModalsContext } from 'shared/ui/ModalsProvider';
import { Button } from 'shared/ui/Button';
import { Input } from 'shared/ui/Input';
import { Text, TEXT_TAGS, TEXT_WEIGHT } from 'shared/ui/Text';
import { isCheckoutEmail } from '../lib/isYandexCheckoutEmail';

const SYNTHETIC_TG_EMAIL_RE = /^tg\d+@telegram\.mindful\.app$/i;

type BuySpreadCreditsModalProps = {
  titleKey?: string;
  bodyKey?: string;
  /** Use `spread` namespace for title/body (daily limit). Default: settings. */
  copyNamespace?: 'settings' | 'spread';
  showBalance?: boolean;
};

function BuySpreadCreditsModal({
  titleKey = 'credits.buy.title',
  bodyKey = 'credits.buy.body',
  copyNamespace = 'settings',
  showBalance = true,
}: BuySpreadCreditsModalProps) {
  const { t: tSettings } = useTranslation('settings');
  const { t: tSpread } = useTranslation('spread');
  const { t: tCore } = useTranslation('core');
  const tCopy = copyNamespace === 'spread' ? tSpread : tSettings;
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const { closeModal } = useData({ Context: ModalsContext });
  const { handleVibrationClick } = useData({
    Context: ApplicationConfigContext,
  });
  const { authUser, spreadCredits } = useData({
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

  const credits = spreadCredits ?? 0;

  useEffect(() => {
    setEmail(suggestedEmail);
  }, [suggestedEmail]);

  useEffect(() => {
    reachMetrikaGoal(MetrikaGoal.buyCreditsOpen);
  }, []);

  const handleClose = useCallback(async () => {
    await handleVibrationClick?.();
    closeModal?.();
  }, [closeModal, handleVibrationClick]);

  const handleBuy = useCallback(async () => {
    await handleVibrationClick?.();
    setError(null);
    reachMetrikaGoal(MetrikaGoal.buyCreditsClick);
    const trimmed = email.trim().toLowerCase();
    if (!isCheckoutEmail(trimmed)) {
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
        } else if (
          result.status === 400 ||
          result.code === 'invalid_email'
        ) {
          setError(
            result.message?.trim() || tSpread('dailyLimit.emailInvalid')
          );
        } else if (result.status === 502 || result.code === 'lava_checkout_failed') {
          const message = result.message?.trim();
          setError(message || tSpread('dailyLimit.lavaRejected'));
        } else {
          const message = result.message?.trim();
          setError(message || tSpread('dailyLimit.buyFailed'));
        }
        return;
      }

      markAwaitingLavaPayment(credits);
      const opened = openExternalPaymentUrl(result.data.paymentUrl);
      if (!opened) {
        setError(tSpread('dailyLimit.buyFailed'));
        return;
      }
      // Keep modal open — Desktop TG often opens checkout in an external
      // browser; closing + refreshing here looked like “modal vanished”.
    } catch (error) {
      console.warn('[buy credits] checkout failed', error);
      setError(tSpread('dailyLimit.buyFailed'));
    } finally {
      setBusy(false);
    }
  }, [credits, email, handleVibrationClick, tSpread]);

  const stopSheetClose = useCallback(
    (event?: { stopPropagation?: () => void }) => {
      event?.stopPropagation?.();
    },
    []
  );

  const cardMaxW = Math.min(420, width - 32);

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
      <Pressable
        accessible={false}
        style={[styles.sheet, { maxWidth: cardMaxW }]}
        onPress={stopSheetClose}
        // RN Web: prevent click-through to backdrop (closes modal on Buy / validation).
        {...(Platform.OS === 'web'
          ? ({
              onClick: (event: { stopPropagation?: () => void }) => {
                event?.stopPropagation?.();
              },
            } as object)
          : null)}
      >
        <LinearGradient
          colors={[COLORS.Primary500, COLORS.Accent, COLORS.Secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.rim}
        />
        <View style={styles.inner}>
          <View style={styles.hero}>
            <LinearGradient
              colors={[
                getColorOpacity(COLORS.Primary500, 28),
                getColorOpacity(COLORS.Accent, 10),
                'transparent',
              ]}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.9, y: 1 }}
              style={styles.heroGlow}
            />
            <View style={styles.iconCluster}>
              <View style={styles.boltBadge}>
                <LightningBolt width={22} height={22} fill={COLORS.Background} />
              </View>
              <CardsVoid width={64} height={64} />
            </View>
            <Text
              category={TEXT_TAGS.h4}
              weight={TEXT_WEIGHT.bold}
              style={styles.packLabel}
            >
              {tSpread('dailyLimit.packBadge')}
            </Text>
          </View>

          <Text category={TEXT_TAGS.h3} style={styles.title}>
            {tCopy(titleKey)}
          </Text>
          <Text category={TEXT_TAGS.p1} style={styles.subtitle}>
            {tCopy(bodyKey)}
          </Text>

          {showBalance && credits > 0 ? (
            <View style={styles.balanceChip}>
              <Text category={TEXT_TAGS.p2} style={styles.balance}>
                {tSettings('credits.buy.balance', { count: credits })}
              </Text>
            </View>
          ) : null}

          <View style={styles.emailWrap}>
            <Input
              label={tSpread('dailyLimit.emailLabel')}
              errorContent={error ?? undefined}
              baseInputProps={{
                value: email,
                onChangeText: (value) => {
                  setEmail(value);
                  if (error) {
                    setError(null);
                  }
                },
                autoCapitalize: 'none',
                autoCorrect: false,
                keyboardType: 'email-address',
                placeholder: tSpread('dailyLimit.emailPlaceholder'),
                editable: !busy,
              }}
            />
            <Text category={TEXT_TAGS.label} style={styles.emailHint}>
              {tSpread('dailyLimit.emailHint')}
            </Text>
          </View>

          <Button style={styles.button} onPress={handleBuy} disabled={busy}>
            {busy
              ? tSpread('dailyLimit.buyLoading')
              : tSpread('dailyLimit.buyCta')}
          </Button>
          <Pressable
            accessibilityRole="button"
            onPress={handleClose}
            disabled={busy}
            style={styles.laterPress}
          >
            <Text category={TEXT_TAGS.p2} style={styles.laterText}>
              {tSpread('dailyLimit.later')}
            </Text>
          </Pressable>
        </View>
      </Pressable>
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
    backgroundColor: getColorOpacity(COLORS.Background, 78),
  },
  sheet: {
    zIndex: 2,
    width: '100%',
    borderRadius: 28,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow:
          '0 28px 56px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(246, 192, 27, 0.12)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 18 },
        shadowOpacity: 0.45,
        shadowRadius: 28,
        elevation: 18,
      },
    }),
  },
  rim: {
    padding: 1.5,
    borderRadius: 28,
  },
  inner: {
    backgroundColor: COLORS.Background2,
    borderRadius: 26.5,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 22,
    alignItems: 'center',
    gap: 10,
  },
  hero: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
    marginBottom: 4,
    overflow: 'hidden',
    borderRadius: 20,
  },
  heroGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
  },
  iconCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  boltBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: COLORS.Primary500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  packLabel: {
    color: COLORS.Content,
    textAlign: 'center',
  },
  title: {
    textAlign: 'center',
    color: COLORS.Content,
  },
  subtitle: {
    textAlign: 'center',
    color: getColorOpacity(COLORS.Content, 74),
    lineHeight: 22,
    paddingHorizontal: 4,
  },
  balanceChip: {
    marginTop: 2,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: getColorOpacity(COLORS.Accent, 14),
  },
  balance: {
    textAlign: 'center',
    color: COLORS.Accent,
  },
  emailWrap: {
    width: '100%',
    marginTop: 8,
    gap: 6,
  },
  emailHint: {
    color: getColorOpacity(COLORS.Content, 48),
    paddingHorizontal: 2,
  },
  button: {
    marginTop: 10,
    width: '100%',
  },
  laterPress: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  laterText: {
    color: getColorOpacity(COLORS.Content, 55),
    textAlign: 'center',
  },
});

export default BuySpreadCreditsModal;
