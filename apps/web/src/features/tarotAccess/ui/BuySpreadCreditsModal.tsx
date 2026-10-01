import { useCallback, useEffect, useMemo, useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, View } from 'react-native';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { UserContext } from 'entities/user';
import { useTranslation } from 'react-i18next';
import { CardsVoid, LightningBolt } from 'shared/icons';
import {
  getLegalDocumentById,
  getLegalDocumentUrl,
} from 'shared/config/legal';
import { useData } from 'shared/DataProvider';
import { cloudFetch } from 'shared/api/cloud/cloudFetch';
import { wakeCloudApi } from 'shared/api/cloud/wakeCloudApi';
import { openExternalPaymentUrl } from 'shared/lib/web/telegramWebApp';
import {
  MetrikaGoal,
  markAwaitingLavaPayment,
  reachMetrikaGoal,
} from 'shared/lib/web/yandexMetrika';
import { DS_COLORS } from 'shared/themes/ds';
import { ModalsContext } from 'shared/ui/ModalsProvider';
import { Button } from 'shared/ui/Button';
import { DsModalSheet } from 'shared/ui/DsModalSheet';
import { Input } from 'shared/ui/Input';
import { Text, TEXT_TAGS, TEXT_WEIGHT } from 'shared/ui/Text';
import { isCheckoutEmail } from '../lib/isYandexCheckoutEmail';

const SYNTHETIC_TG_EMAIL_RE = /^tg\d+@telegram\.mindful\.app$/i;

/** Документы, условия которых принимаются оплатой. */
const LEGAL_CONSENT_DOCS = ['offer', 'refund']
  .map((id) => getLegalDocumentById(id))
  .filter((document): document is NonNullable<typeof document> => !!document);

function openLegalDocument(id: string): void {
  const url = getLegalDocumentUrl(id);
  if (url) {
    void Linking.openURL(url);
  }
}

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

  return (
    <DsModalSheet
      onClose={handleClose}
      closeAccessibilityLabel={tCore('stub.emptyResultsModal.closeBackdrop')}
      maxWidth={420}
    >
        <View style={styles.inner}>
          <View style={styles.hero}>
            <View style={styles.iconCluster}>
              <View style={styles.boltBadge}>
                <LightningBolt width={22} height={22} fill={DS_COLORS.ground900} />
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
          <View style={styles.legalRow}>
            <Text category={TEXT_TAGS.label} style={styles.legalNote}>
              {tSpread('dailyLimit.legalNote')}
            </Text>
            {LEGAL_CONSENT_DOCS.map((document) => (
              <Text
                key={document.id}
                category={TEXT_TAGS.label}
                style={styles.legalLink}
                onPress={() => openLegalDocument(document.id)}
              >
                {document.title}
              </Text>
            ))}
          </View>
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
    </DsModalSheet>
  );
}

const styles = StyleSheet.create({
  inner: {
    backgroundColor: DS_COLORS.ground800,
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
    backgroundColor: DS_COLORS.accent400,
    alignItems: 'center',
    justifyContent: 'center',
  },
  packLabel: {
    color: DS_COLORS.ink100,
    textAlign: 'center',
  },
  title: {
    textAlign: 'center',
    color: DS_COLORS.ink50,
  },
  subtitle: {
    textAlign: 'center',
    color: DS_COLORS.ink100,
    lineHeight: 22,
    paddingHorizontal: 4,
  },
  balanceChip: {
    marginTop: 2,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: DS_COLORS.ground600,
    backgroundColor: DS_COLORS.ground700,
  },
  balance: {
    textAlign: 'center',
    color: DS_COLORS.accent400,
  },
  emailWrap: {
    width: '100%',
    marginTop: 8,
    gap: 6,
  },
  emailHint: {
    color: DS_COLORS.ink100,
    paddingHorizontal: 2,
  },
  button: {
    marginTop: 10,
    width: '100%',
  },
  legalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    columnGap: 6,
    rowGap: 2,
    marginTop: 10,
    paddingHorizontal: 8,
  },
  legalNote: {
    color: DS_COLORS.ink100,
  },
  legalLink: {
    color: DS_COLORS.accent400,
    textDecorationLine: 'underline',
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : {}),
  },
  laterPress: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  laterText: {
    color: DS_COLORS.ink100,
    textAlign: 'center',
  },
});

export default BuySpreadCreditsModal;
