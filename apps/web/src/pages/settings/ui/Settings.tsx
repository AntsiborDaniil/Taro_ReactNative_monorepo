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
import {
  BookIcon,
  ChevronRightIcon,
  LightningBolt,
  ReverseIcon,
} from 'shared/icons';
import { AsyncMemorySettingKey, isTablet, moderateScale } from 'shared/lib';
import { isTelegramMiniApp } from 'shared/lib/web/telegramWebApp';
import { SETTINGS_TYPOGRAPHY } from 'shared/themes';
import { DS_COLORS, DS_SIZES, DS_SPACE, dsRadius, dsWebTransition } from 'shared/themes/ds';
import { AnalyticAction, NavigationRoute, PressableWebState } from 'shared/types';
import { ScreenLayout, SwitchElement, Text, TEXT_TAGS } from 'shared/ui';
import { ModalsContext } from 'shared/ui/ModalsProvider';
import { getSettingsRoutes } from '../lib';
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
      : 0;
  const remainingTotal = dailyRemaining + credits;

  const quotaBadge = useMemo(() => {
    if (isPractitioner) {
      return { mode: 'unlimited' as const };
    }
    if (!isAuthenticated) {
      return null;
    }
    if (credits > 0) {
      return { mode: 'credits' as const, remaining: remainingTotal };
    }
    return { mode: 'daily' as const, remaining: remainingTotal };
  }, [credits, isAuthenticated, isPractitioner, remainingTotal]);

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

    navigation.navigate(screen as never);
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
          hideSpreadQuota
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
                size={17}
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
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('settings:credits.buy.row')}
              onPress={openBuyCredits}
              style={(s: PressableWebState) => {
                const { hovered, pressed } = s;
                return [
                  webStyles.card,
                  webStyles.buyRow,
                  (hovered || pressed) && webStyles.rowActive,
                ];
              }}
            >
              <View style={styles.iconWrapper}>
                <View style={styles.icon}>
                  <LightningBolt
                    width={isTablet ? 28 : 22}
                    height={isTablet ? 28 : 22}
                    fill={DS_COLORS.accent400}
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
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('settings:legal.title')}
              onPress={() => handlePress(NavigationRoute.Legal, 'legal')}
              style={(s: PressableWebState) => {
                const { hovered, pressed } = s;
                return [
                  webStyles.card,
                  webStyles.buyRow,
                  (hovered || pressed) && webStyles.rowActive,
                ];
              }}
            >
              <View style={styles.iconWrapper}>
                <View style={styles.icon}>
                  <BookIcon
                    width={isTablet ? 28 : 22}
                    height={isTablet ? 28 : 22}
                    fill={DS_COLORS.accent400}
                  />
                </View>
                <View style={webStyles.rowTextCol}>
                  <Text
                    category={TEXT_TAGS.h4}
                    style={[styles.text, styles.settingsBody]}
                  >
                    {t('settings:legal.title')}
                  </Text>
                  <Text
                    category={TEXT_TAGS.p2}
                    style={[webStyles.rowHint, styles.settingsFootnote]}
                  >
                    {t('settings:legal.row.hint')}
                  </Text>
                </View>
              </View>
              <ChevronRightIcon
                width={isTablet ? 26 : 17}
                height={isTablet ? 26 : 17}
              />
            </Pressable>
            <View style={webStyles.legalSpacer} />
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
        <Text
          style={[styles.agreement, styles.settingsFootnote]}
          category={TEXT_TAGS.h5}
          onPress={() => handlePress(NavigationRoute.Legal)}
        >
          {t('settings:legal.title')}
        </Text>
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
      gap: 14,
    },
    sectionLabel: {
      marginTop: 16,
      marginBottom: 6,
      color: DS_COLORS.accent400,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
    },
    reversedSwitchWrap: {
      minHeight: DS_SIZES.listRowHeight,
      paddingVertical: DS_SPACE.l,
      paddingHorizontal: DS_SPACE.l,
      width: '100%',
    },
    /** Группа строк списка DS: ground700, кант ground600, радиус r18. */
    card: {
      width: '100%',
      overflow: 'hidden',
      borderRadius: dsRadius.listRow,
      borderWidth: DS_SIZES.hairline,
      borderColor: DS_COLORS.ground600,
      backgroundColor: DS_COLORS.ground700,
    },
    /** Вложенный разделитель между строками одной группы. */
    dividerInCard: {
      height: DS_SIZES.hairline,
      backgroundColor: DS_COLORS.ground600,
      marginHorizontal: DS_SPACE.l,
    },
    buyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: DS_SIZES.listRowHeight,
      paddingHorizontal: DS_SPACE.l,
      ...(Platform.OS === 'web'
        ? ({ cursor: 'pointer' as const, ...dsWebTransition } as object)
        : {}),
    },
    /** Строка списка DS: h64, иконка слева, шеврон справа (см. card для радиуса группы). */
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: DS_SIZES.listRowHeight,
      paddingHorizontal: DS_SPACE.l,
      ...(Platform.OS === 'web'
        ? ({ cursor: 'pointer' as const, ...dsWebTransition } as object)
        : {}),
    },
    rowActive: {
      backgroundColor: DS_COLORS.pressDim,
    },
    rowTextCol: {
      flex: 1,
      minWidth: 0,
      gap: 4,
    },
    rowHint: {
      color: DS_COLORS.ink100,
      lineHeight: 18,
    },
    legalSpacer: {
      height: 24,
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
    gap: moderateScale(16),
    paddingHorizontal: moderateScale(16),
    paddingTop: moderateScale(8),
    paddingBottom: moderateScale(24),
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
    flexWrap: 'wrap',
    gap: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: moderateScale(8),
    marginBottom: moderateScale(48),
    paddingHorizontal: moderateScale(8),
  },
  agreement: {
    textDecorationLine: 'underline',
    color: 'color-gray-500',
  },
});

export default Settings;
