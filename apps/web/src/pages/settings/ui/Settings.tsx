import { Fragment, createElement, useCallback, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import AppMetrica from '@appmetrica/react-native-analytics';
import { StyleService, useStyleSheet } from '@ui-kitten/components';
import { useTabRailLayout } from 'app/navigation/tabs/TabRailLayoutContext';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { UserContext } from 'entities/user';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { Header } from 'features/header';
import {
  BuySpreadCreditsModal,
  SpreadCreditsBadge,
} from 'features/tarotAccess/ui';
import { useData } from 'shared/DataProvider';
import { useNativeNavigation } from 'shared/hooks';
import { ChevronRightIcon, LightningBolt, ReverseIcon } from 'shared/icons';
import {
  AsyncMemorySettingKey,
  isTablet,
  moderateScale,
  WEB_HOVER_TRANSITION,
} from 'shared/lib';
import { isTelegramMiniApp } from 'shared/lib/web/telegramWebApp';
import { COLORS, SETTINGS_TYPOGRAPHY } from 'shared/themes';
import { AnalyticAction, NavigationRoute, PressableWebState, TabRoute } from 'shared/types';
import { ScreenLayout, SwitchElement, Text, TEXT_TAGS } from 'shared/ui';
import { ModalsContext } from 'shared/ui/ModalsProvider';
import { APP_AGREEMENTS, getSettingsRoutes } from '../lib';
import { useSettings } from '../model';
import LanguagePickerModal from './Language/LanguagePickerModal';

const WEB_ROW_KEYS_ACCOUNT = new Set(['account']);
const WEB_ROW_KEYS_LOOK = new Set(['language', 'deck.style']);

function Settings() {
  const { t } = useTranslation();
  const isWeb = Platform.OS === 'web';
  const isTgMiniApp = isWeb && isTelegramMiniApp();
  const { sceneContentWidth } = useTabRailLayout();
  const [languageModalOpen, setLanguageModalOpen] = useState(false);

  const { handleChangeBase } = useSettings({
    hasAutoSave: true,
    asyncMemoryKey: AsyncMemorySettingKey.Spread,
  });

  const { spread: spreadSettings, handleVibrationClick } = useData({
    Context: ApplicationConfigContext,
  });
  const { spreadCredits, tarotDaily, isPractitioner, isAuthenticated } =
    useData({ Context: UserContext });
  const { showModal } = useData({ Context: ModalsContext });

  const styles = useStyleSheet(styleSheet);
  const webStyles = useMemo(() => (isWeb ? createWebStyles() : null), [isWeb]);

  const navigation = useNativeNavigation();

  const credits = spreadCredits ?? 0;
  const dailyRemaining =
    tarotDaily != null
      ? Math.max(0, tarotDaily.limit - tarotDaily.used)
      : null;

  const quotaBadge = useMemo(() => {
    if (isPractitioner) {
      return { mode: 'unlimited' as const };
    }
    if (credits > 0) {
      return { mode: 'credits' as const, remaining: credits };
    }
    if (isAuthenticated && dailyRemaining != null) {
      return { mode: 'daily' as const, remaining: dailyRemaining };
    }
    return null;
  }, [credits, dailyRemaining, isAuthenticated, isPractitioner]);

  const openBuyCredits = useCallback(async () => {
    AppMetrica.reportEvent(AnalyticAction.ClickSettingsSegment, {
      segment: 'credits.buy',
    });
    await handleVibrationClick?.();
    showModal?.(createElement(BuySpreadCreditsModal));
  }, [handleVibrationClick, showModal]);

  const quotaA11y = useMemo(() => {
    if (!quotaBadge) {
      return undefined;
    }
    if (quotaBadge.mode === 'unlimited') {
      return t('settings:credits.badge.a11yUnlimited');
    }
    if (quotaBadge.mode === 'credits') {
      return t('settings:credits.badge.a11yCredits', {
        count: quotaBadge.remaining,
      });
    }
    return t('settings:credits.badge.a11yDaily', {
      count: quotaBadge.remaining,
    });
  }, [quotaBadge, t]);

  const settingsRoutes = useMemo(
    () =>
      getSettingsRoutes({
        isTelegramMiniApp: isTgMiniApp,
      }),
    [isTgMiniApp]
  );

  const handlePress = async (
    screen?: NavigationRoute,
    title?: string,
    onPress?: (t?: TFunction<'translation', undefined>) => void
  ) => {
    AppMetrica.reportEvent(AnalyticAction.ClickSettingsSegment, {
      segment: title,
    });

    await handleVibrationClick?.();

    if (Platform.OS === 'web' && screen === NavigationRoute.Language) {
      setLanguageModalOpen(true);
      return;
    }

    if (!screen) {
      onPress?.(t);

      return;
    }

    navigation.navigate(TabRoute.LibraryTab, {
      screen,
    });
  };

  const scenePad = moderateScale(16);
  const contentMax = Math.min(560, Math.max(320, sceneContentWidth - scenePad * 2));

  if (isWeb && webStyles) {
    const accountRoutes = settingsRoutes.filter((r) =>
      WEB_ROW_KEYS_ACCOUNT.has(r.title)
    );
    const lookRoutes = settingsRoutes.filter((r) => WEB_ROW_KEYS_LOOK.has(r.title));

    return (
      <ScreenLayout style={styles.container}>
        <Header
          title={t('settings:settings')}
          titleStyle={styles.settingsBody}
          rightAction={
            quotaBadge && quotaBadge.mode !== 'unlimited'
              ? openBuyCredits
              : null
          }
          rightContent={
            quotaBadge ? (
              <SpreadCreditsBadge
                mode={quotaBadge.mode}
                remaining={
                  quotaBadge.mode === 'unlimited'
                    ? undefined
                    : quotaBadge.remaining
                }
              />
            ) : undefined
          }
          rightAccessibilityLabel={quotaA11y}
        />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            webStyles.scrollContent,
            { paddingHorizontal: scenePad, paddingBottom: 48 },
          ]}
        >
          <View style={[webStyles.pageColumn, { maxWidth: contentMax }]}>
            <Text category={TEXT_TAGS.label} style={webStyles.sectionLabel}>
              {t('settings:section.game')}
            </Text>
            <View style={webStyles.card}>
              <SwitchElement
                name="settings:hasReversed"
                style={webStyles.reversedSwitchWrap}
                labelStyle={styles.settingsBody}
                icon={
                  <ReverseIcon
                    width={isTablet ? 34 : 24}
                    height={isTablet ? 33 : 23}
                  />
                }
                value={spreadSettings?.hasReversed}
                onValueChange={(value) => {
                  handleChangeBase<boolean>(value, 'hasReversed');
                }}
              />
              <View style={webStyles.dividerInCard} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('settings:credits.buy.row')}
                onPress={openBuyCredits}
                style={(s: PressableWebState) => {
                  const { hovered, pressed } = s;
                  return [
                    webStyles.row,
                    (hovered || pressed) && webStyles.rowActive,
                  ];
                }}
              >
                <View style={styles.iconWrapper}>
                  <View style={styles.icon}>
                    <LightningBolt
                      width={isTablet ? 28 : 22}
                      height={isTablet ? 28 : 22}
                      fill={COLORS.Primary500}
                    />
                  </View>
                  <View style={webStyles.rowTextCol}>
                    <Text
                      category={TEXT_TAGS.h4}
                      style={[styles.text, styles.settingsBody]}
                    >
                      {t('settings:credits.buy.row')}
                    </Text>
                    <Text
                      category={TEXT_TAGS.p2}
                      style={[webStyles.rowHint, styles.settingsFootnote]}
                    >
                      {t('settings:credits.buy.rowHint', { count: credits })}
                    </Text>
                  </View>
                </View>
                <ChevronRightIcon
                  width={isTablet ? 26 : 17}
                  height={isTablet ? 26 : 17}
                />
              </Pressable>
            </View>

            {accountRoutes.length > 0 ? (
              <>
                <Text category={TEXT_TAGS.label} style={webStyles.sectionLabel}>
                  {t('settings:section.account')}
                </Text>
                <View style={webStyles.card}>
                  {accountRoutes.map((route) => (
                    <Pressable
                      key={route.title}
                      accessibilityRole="button"
                      onPress={() =>
                        handlePress(route.url, route.title, route.onPress)
                      }
                      style={(s: PressableWebState) => {
                        const { hovered, pressed } = s;
                        return [
                          webStyles.row,
                          (hovered || pressed) && webStyles.rowActive,
                        ];
                      }}
                    >
                      <View style={styles.iconWrapper}>
                        <View style={styles.icon}>{route.icon}</View>
                        <Text
                          category={TEXT_TAGS.h4}
                          style={[styles.text, styles.settingsBody]}
                        >
                          {t(`settings:${route.title}`)}
                        </Text>
                      </View>
                      <ChevronRightIcon
                        width={isTablet ? 26 : 17}
                        height={isTablet ? 26 : 17}
                      />
                    </Pressable>
                  ))}
                </View>
              </>
            ) : null}

            <Text category={TEXT_TAGS.label} style={webStyles.sectionLabel}>
              {t('settings:section.look')}
            </Text>
            <View style={webStyles.card}>
              {lookRoutes.map((route, index) => (
                <Fragment key={route.title}>
                  {index > 0 ? <View style={webStyles.dividerInCard} /> : null}
                  <Pressable
                    accessibilityRole="button"
                    onPress={() =>
                      handlePress(route.url, route.title, route.onPress)
                    }
                    style={(s: PressableWebState) => {
                      const { hovered, pressed } = s;
                      return [
                      webStyles.row,
                      (hovered || pressed) && webStyles.rowActive,
                    ];
                    }}
                  >
                    <View style={styles.iconWrapper}>
                      <View style={styles.icon}>{route.icon}</View>
                      <Text
                        category={TEXT_TAGS.h4}
                        style={[styles.text, styles.settingsBody]}
                      >
                        {t(`settings:${route.title}`)}
                      </Text>
                    </View>
                    <ChevronRightIcon
                      width={isTablet ? 26 : 17}
                      height={isTablet ? 26 : 17}
                    />
                  </Pressable>
                </Fragment>
              ))}
            </View>

            <Text category={TEXT_TAGS.label} style={webStyles.sectionLabel}>
              {t('settings:section.legal')}
            </Text>
            <View style={webStyles.legalRow}>
              {APP_AGREEMENTS.map(({ title, url }) => (
                <Text
                  style={[styles.agreement, styles.settingsFootnote]}
                  key={title}
                  category={TEXT_TAGS.h5}
                  onPress={() => handlePress(url)}
                >
                  {t(`settings:${title}`)}
                </Text>
              ))}
            </View>
          </View>
        </ScrollView>

        <LanguagePickerModal
          visible={languageModalOpen}
          onClose={() => setLanguageModalOpen(false)}
        />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout style={styles.container}>
      <Header
        title={t('settings:settings')}
        titleStyle={styles.settingsBody}
      />
      <ScrollView contentContainerStyle={styles.wrapper}>
        <SwitchElement
          name="settings:hasReversed"
          labelStyle={styles.settingsBody}
          icon={
            <ReverseIcon
              width={isTablet ? 34 : 24}
              height={isTablet ? 33 : 23}
            />
          }
          value={spreadSettings?.hasReversed}
          onValueChange={(value) => {
            handleChangeBase<boolean>(value, 'hasReversed');
          }}
        />
        <View style={styles.divider} />
        {settingsRoutes.map(({ icon, title, url, onPress }, index) => (
          <Fragment key={title}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handlePress(url, title, onPress)}
            >
              <View style={styles.item}>
                <View style={styles.iconWrapper}>
                  <View style={styles.icon}>{icon}</View>
                  <Text
                    category={TEXT_TAGS.h4}
                    style={[styles.text, styles.settingsBody]}
                  >
                    {t(`settings:${title}`)}
                  </Text>
                </View>
                <ChevronRightIcon
                  width={isTablet ? 26 : 17}
                  height={isTablet ? 26 : 17}
                />
              </View>
            </TouchableOpacity>
            {index < settingsRoutes.length - 1 && (
              <View style={styles.divider} />
            )}
          </Fragment>
        ))}
      </ScrollView>
      <View style={styles.agreements}>
        {APP_AGREEMENTS.map(({ title, url }) => (
          <Text
            style={[styles.agreement, styles.settingsFootnote]}
            key={title}
            category={TEXT_TAGS.h5}
            onPress={() => handlePress(url)}
          >
            {t(`settings:${title}`)}
          </Text>
        ))}
      </View>
    </ScreenLayout>
  );
}

function createWebStyles() {
  return StyleSheet.create({
    scrollContent: {
      flexGrow: 1,
      alignItems: 'center',
      width: '100%',
      paddingTop: 8,
    },
    pageColumn: {
      width: '100%',
      alignSelf: 'center',
      gap: 10,
    },
    sectionLabel: {
      marginTop: 14,
      marginBottom: 4,
      color: COLORS.Primary,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
    },
    reversedSwitchWrap: {
      paddingVertical: 20,
      paddingHorizontal: 18,
      width: '100%',
    },
    card: {
      width: '100%',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(246, 192, 27, 0.16)',
      backgroundColor: COLORS.Background2,
      paddingVertical: 8,
      paddingHorizontal: 8,
      ...(Platform.OS === 'web'
        ? ({
            boxShadow:
              '0 10px 32px rgba(8, 12, 20, 0.35), inset 0 1px 0 rgba(246, 192, 27, 0.05)',
          } as object)
        : {}),
    },
    dividerInCard: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: 'rgba(244,244,245,0.12)',
      marginHorizontal: 8,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 10,
      borderRadius: 12,
      ...(Platform.OS === 'web'
        ? ({ cursor: 'pointer' as const, ...WEB_HOVER_TRANSITION } as object)
        : {}),
    },
    rowActive: {
      backgroundColor: 'rgba(100, 152, 202, 0.12)',
    },
    rowTextCol: {
      flex: 1,
      minWidth: 0,
      gap: 4,
    },
    rowHint: {
      color: COLORS.SpbSky1,
      lineHeight: 18,
    },
    legalRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: moderateScale(12),
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
      marginBottom: 32,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    modalCard: {
      width: '100%',
      maxWidth: 400,
      borderRadius: 28,
      padding: 28,
      backgroundColor: COLORS.Background2,
      borderWidth: 1,
      borderColor: 'rgba(246, 192, 27, 0.22)',
      gap: 14,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
    },
    modalTitle: {
      flex: 1,
      color: COLORS.Content,
    },
    modalSubtitle: {
      color: COLORS.SpbSky1,
      lineHeight: 20,
    },
    modalButtons: {
      gap: 14,
      marginTop: 8,
      paddingVertical: 20,
      paddingHorizontal: 16,
    },
    storeButton: {
      width: '100%',
    },
    storeButtonSecondary: {
      width: '100%',
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: COLORS.Primary,
    },
    storeButtonOutlineText: {
      color: COLORS.Primary,
    },
  });
}

const styleSheet = StyleService.create({
  settingsBody: {
    fontSize: SETTINGS_TYPOGRAPHY.body,
  },
  settingsFootnote: {
    fontSize: SETTINGS_TYPOGRAPHY.footnote,
  },
  container: {
    flex: 1,
  },
  wrapper: {
    flex: 1,
    justifyContent: 'center',
    gap: moderateScale(14),
    padding: moderateScale(14),
  },
  icon: {
    width: 30,
  },
  item: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  divider: {
    height: 1,
    backgroundColor: 'color-gray-500',
    opacity: 0.3,
  },
  iconWrapper: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: moderateScale(14),
    flex: 1,
    minWidth: 0,
  },
  text: {
    alignItems: 'flex-start',
  },
  agreements: {
    flexDirection: 'row',
    gap: moderateScale(8),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(44),
  },
  agreement: {
    textDecorationLine: 'underline',
    color: 'color-gray-500',
  },
});

export default Settings;
