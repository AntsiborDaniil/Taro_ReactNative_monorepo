import { Fragment } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import AppMetrica from '@appmetrica/react-native-analytics';
import { StyleService, useStyleSheet } from '@ui-kitten/components';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { Header } from 'features/header';
import { PaidContent } from 'features/paidContent';
import { useData } from 'shared/DataProvider';
import { useNativeNavigation } from 'shared/hooks';
import { ChevronRightIcon, ReverseIcon } from 'shared/icons';
import { AsyncMemorySettingKey, isTablet, moderateScale } from 'shared/lib';
import { AnalyticAction, NavigationRoute, TabRoute } from 'shared/types';
import { ScreenLayout, SwitchElement, Text, TEXT_TAGS } from 'shared/ui';
import { ModalsContext } from 'shared/ui/ModalsProvider';
import { APP_AGREEMENTS, SETTINGS_ROUTES } from '../lib';
import { useSettings } from '../model';

function Settings() {
  const { t } = useTranslation();

  const { handleChangeBase } = useSettings({
    hasAutoSave: true,
    asyncMemoryKey: AsyncMemorySettingKey.Spread,
  });

  const { showModal } = useData({ Context: ModalsContext });

  const { spread: spreadSettings, handleVibrationClick } = useData({
    Context: ApplicationConfigContext,
  });

  const styles = useStyleSheet(styleSheet);

  const navigation = useNativeNavigation();

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

  return (
    <ScreenLayout style={styles.container}>
      <Header title={t('settings:settings')} />
      <ScrollView contentContainerStyle={styles.wrapper}>
        <SwitchElement
          name="settings:hasReversed"
          icon={
            <ReverseIcon
              width={isTablet ? 37 : 27}
              height={isTablet ? 36 : 26}
            />
          }
          value={spreadSettings?.hasReversed}
          onValueChange={(value) => {
            handleChangeBase<boolean>(value, 'hasReversed');
          }}
        />
        <View style={styles.divider} />
        {SETTINGS_ROUTES.map(({ icon, title, url, onPress }, index) => (
          <Fragment key={title}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handlePress(url, title, onPress)}
            >
              <View style={styles.item}>
                <View style={styles.iconWrapper}>
                  <View style={styles.icon}>{icon}</View>
                  <Text style={styles.text}>{t(`settings:${title}`)}</Text>
                </View>
                <ChevronRightIcon
                  width={isTablet ? 28 : 18}
                  height={isTablet ? 28 : 18}
                />
              </View>
            </TouchableOpacity>
            {index < SETTINGS_ROUTES.length - 1 && (
              <View style={styles.divider} />
            )}
          </Fragment>
        ))}
      </ScrollView>
      <View style={styles.agreements}>
        {APP_AGREEMENTS.map(({ title, url }) => (
          <Text
            style={styles.agreement}
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

const styleSheet = StyleService.create({
  container: {
    flex: 1,
  },
  wrapper: {
    flex: 1,
    justifyContent: 'center',
    gap: moderateScale(16),
    padding: 16,
  },
  icon: {
    width: 32,
  },
  item: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 6,
    paddingBottom: 6,
  },
  divider: {
    height: 1,
    backgroundColor: 'color-gray-500',
    opacity: 0.3,
  },
  iconWrapper: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 32,
  },
  text: {
    alignItems: 'flex-start',
  },
  agreements: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 50,
  },
  agreement: {
    textDecorationLine: 'underline',
    color: 'color-gray-500',
  },
});

export default Settings;
