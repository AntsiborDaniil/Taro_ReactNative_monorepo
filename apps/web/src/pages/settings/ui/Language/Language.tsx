import { TouchableOpacity, View } from 'react-native';
import AppMetrica from '@appmetrica/react-native-analytics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StyleService, useStyleSheet } from '@ui-kitten/components';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { useTranslation } from 'react-i18next';
import { Header } from 'features/header';
import { useData } from 'shared/DataProvider';
import { Checked } from 'shared/icons';
import { isTablet } from 'shared/lib';
import { AnalyticAction } from 'shared/types';
import { ScreenLayout, Text, TEXT_TAGS } from 'shared/ui';
import { LANGUAGES } from '../../lib';

function Language() {
  const { i18n, t } = useTranslation();

  const { handleVibrationClick } = useData({
    Context: ApplicationConfigContext,
  });

  const styles = useStyleSheet(styleSheet);

  const handleChangeLanguage = async (lang: string) => {
    await AsyncStorage.setItem('language', lang);
    await i18n.changeLanguage(lang);
  };

  return (
    <ScreenLayout style={styles.container}>
      <Header title={t('settings:language')} />
      <View style={styles.wrapper}>
        {LANGUAGES.map((language) => (
          <TouchableOpacity
            style={styles.item}
            key={language.value}
            onPress={async () => {
              await handleVibrationClick?.();

              await handleChangeLanguage(language.value);

              AppMetrica.reportEvent(AnalyticAction.ClickChangeLanguage, {
                lang: language.title,
              });
            }}
          >
            <View style={styles.iconWrapper}>
              {language.icon}
              <Text category={TEXT_TAGS.h4}>{language.title}</Text>
            </View>
            {language.value === i18n.language && (
              <Checked width={isTablet ? 34 : 24} height={isTablet ? 34 : 24} />
            )}
          </TouchableOpacity>
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
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 26,
    padding: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconWrapper: {
    gap: 26,
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'row',
  },
});

export default Language;
