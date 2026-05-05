import { Fragment, useCallback, useMemo, useState } from 'react';
import {
  Linking,
  Modal,
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
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { Header } from 'features/header';
import { PaidContent } from 'features/paidContent';
import { useData } from 'shared/DataProvider';
import { useNativeNavigation } from 'shared/hooks';
import { ChevronRightIcon, CrossIcon, ReverseIcon } from 'shared/icons';
import { AsyncMemorySettingKey, isTablet, moderateScale } from 'shared/lib';
import { COLORS, SETTINGS_TYPOGRAPHY } from 'shared/themes';
import { appStoreLinks } from 'shared/utils';
import { AnalyticAction, NavigationRoute, TabRoute } from 'shared/types';
import { Button, ScreenLayout, SwitchElement, Text, TEXT_TAGS } from 'shared/ui';
import { ModalsContext } from 'shared/ui/ModalsProvider';
import { APP_AGREEMENTS, getSettingsRoutes } from '../lib';
import { useSettings } from '../model';

const WEB_ROW_KEYS_ACCOUNT = new Set(['account']);
const WEB_ROW_KEYS_LOOK = new Set(['language', 'deck.style']);
const WEB_ROW_KEYS_SHARE = new Set(['share.web']);
const WEB_ROW_KEYS_MOBILE = new Set(['mobile.app']);

function Settings() {
  const { t } = useTranslation();
  const isWeb = Platform.OS === 'web';
  const { sceneContentWidth } = useTabRailLayout();
  const [storeModalOpen, setStoreModalOpen] = useState(false);

  const { handleChangeBase } = useSettings({
    hasAutoSave: true,
    asyncMemoryKey: AsyncMemorySettingKey.Spread,
  });

  const { showModal } = useData({ Context: ModalsContext });

  const { spread: spreadSettings, handleVibrationClick } = useData({
    Context: ApplicationConfigContext,
  });

  const styles = useStyleSheet(styleSheet);
  const webStyles = useMemo(() => (isWeb ? createWebStyles() : null), [isWeb]);

  const navigation = useNativeNavigation();

  const settingsRoutes = useMemo(
    () =>
      getSettingsRoutes({
        onMobileAppPress: () => setStoreModalOpen(true),
      }),
    []
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

    if (title === 'payments') {
      showModal?.(<PaidContent />);

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

  const openStore = useCallback(async (url: string) => {
    await handleVibrationClick?.();
    try {
      await Linking.openURL(url);
    } catch {
      if (typeof window !== 'undefined') {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    }
    setStoreModalOpen(false);
  }, [handleVibrationClick]);

  const scenePad = moderateScale(16);
  const contentMax = Math.min(560, Math.max(320, sceneContentWidth - scenePad * 2));

  if (isWeb && webStyles) {
    const accountRoutes = settingsRoutes.filter((r) =>
      WEB_ROW_KEYS_ACCOUNT.has(r.title)
    );
    const lookRoutes = settingsRoutes.filter((r) => WEB_ROW_KEYS_LOOK.has(r.title));
    const shareRoutes = settingsRoutes.filter((r) => WEB_ROW_KEYS_SHARE.has(r.title));
    const mobileRoutes = settingsRoutes.filter((r) => WEB_ROW_KEYS_MOBILE.has(r.title));

    return (
      <ScreenLayout style={styles.container}>
        <Header
          title={t('settings:settings')}
          titleStyle={styles.settingsBody}
        />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            webStyles.scrollContent,
            { paddingHorizontal: scenePad, paddingBottom: 48 },
          ]}
        >
          <View style={[webStyles.pageColumn, { maxWidth: contentMax }]}>
            <Text category={TEXT_TAGS.h5} style={webStyles.pageHint}>
              {t('settings:web.page.hint')}
            </Text>

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
                  style={({ hovered, pressed }) => [
                    webStyles.row,
                    (hovered || pressed) && webStyles.rowActive,
                  ]}
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
                    style={({ hovered, pressed }) => [
                      webStyles.row,
                      (hovered || pressed) && webStyles.rowActive,
                    ]}
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
              {t('settings:section.share')}
            </Text>
            <View style={webStyles.card}>
              {shareRoutes.map((route) => (
                <Pressable
                  key={route.title}
                  accessibilityRole="button"
                  onPress={() =>
                    handlePress(route.url, route.title, route.onPress)
                  }
                  style={({ hovered, pressed }) => [
                    webStyles.row,
                    (hovered || pressed) && webStyles.rowActive,
                  ]}
                >
                  <View style={styles.iconWrapper}>
                    <View style={styles.icon}>{route.icon}</View>
                    <View style={webStyles.rowTextCol}>
                      <Text
                        category={TEXT_TAGS.h4}
                        style={[styles.text, styles.settingsBody]}
                      >
                        {t(`settings:${route.title}`)}
                      </Text>
                      <Text category={TEXT_TAGS.p2} style={webStyles.rowHint}>
                        {t('settings:share.web.hint')}
                      </Text>
                    </View>
                  </View>
                  <ChevronRightIcon
                    width={isTablet ? 26 : 17}
                    height={isTablet ? 26 : 17}
                  />
                </Pressable>
              ))}
            </View>

            <Text category={TEXT_TAGS.label} style={webStyles.sectionLabel}>
              {t('settings:section.mobile')}
            </Text>
            <View style={webStyles.card}>
              {mobileRoutes.map((route) => (
                <Pressable
                  key={route.title}
                  accessibilityRole="button"
                  onPress={() =>
                    handlePress(route.url, route.title, route.onPress)
                  }
                  style={({ hovered, pressed }) => [
                    webStyles.row,
                    (hovered || pressed) && webStyles.rowActive,
                  ]}
                >
                  <View style={styles.iconWrapper}>
                    <View style={styles.icon}>{route.icon}</View>
                    <View style={webStyles.rowTextCol}>
                      <Text
                        category={TEXT_TAGS.h4}
                        style={[styles.text, styles.settingsBody]}
                      >
                        {t(`settings:${route.title}`)}
                      </Text>
                      <Text category={TEXT_TAGS.p2} style={webStyles.rowHint}>
                        {t('settings:mobile.app.hint')}
                      </Text>
                    </View>
                  </View>
                  <ChevronRightIcon
                    width={isTablet ? 26 : 17}
                    height={isTablet ? 26 : 17}
                  />
                </Pressable>
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

        <Modal
          visible={storeModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setStoreModalOpen(false)}
        >
          <Pressable
            style={webStyles.modalBackdrop}
            onPress={() => setStoreModalOpen(false)}
          >
            <Pressable
              style={webStyles.modalCard}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={webStyles.modalHeader}>
                <Text category={TEXT_TAGS.h3} style={webStyles.modalTitle}>
                  {t('settings:store.modal.title')}
                </Text>
                <TouchableOpacity
                  accessibilityLabel={t('core:stub.emptyResultsModal.closeBackdrop')}
                  hitSlop={12}
                  onPress={() => setStoreModalOpen(false)}
                >
                  <CrossIcon width={22} height={22} />
                </TouchableOpacity>
              </View>
              <Text category={TEXT_TAGS.p2} style={webStyles.modalSubtitle}>
                {t('settings:store.modal.subtitle')}
              </Text>
              <View style={webStyles.modalButtons}>
                <Button
                  style={webStyles.storeButton}
                  onPress={() => openStore(appStoreLinks.ios)}
                >
                  {t('core:downloadAppStore')}
                </Button>
                <Button
                  style={webStyles.storeButtonSecondary}
                  onPress={() => openStore(appStoreLinks.android)}
                >
                  <Text category={TEXT_TAGS.h3} style={webStyles.storeButtonOutlineText}>
                    {t('core:downloadGooglePlay')}
                  </Text>
                </Button>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
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
    pageHint: {
      color: COLORS.SpbSky1,
      textAlign: 'center',
      marginBottom: 8,
      lineHeight: 20,
    },
    sectionLabel: {
      marginTop: 14,
      marginBottom: 4,
      color: COLORS.Primary,
      letterSpacing: 0.6,
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
      borderColor: 'rgba(175, 161, 232, 0.18)',
      backgroundColor: COLORS.Background2,
      paddingVertical: 8,
      paddingHorizontal: 8,
      ...(Platform.OS === 'web'
        ? ({
            boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
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
        ? ({ cursor: 'pointer' as const } as object)
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
      borderRadius: 20,
      padding: 28,
      backgroundColor: COLORS.Background2,
      borderWidth: 1,
      borderColor: 'rgba(175, 161, 232, 0.25)',
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
