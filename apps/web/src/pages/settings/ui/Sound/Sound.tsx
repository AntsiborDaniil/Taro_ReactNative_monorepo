import { Platform, View } from 'react-native';
import { StyleService, useStyleSheet } from '@ui-kitten/components';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { useTranslation } from 'react-i18next';
import { Header } from 'features/header';
import { useData } from 'shared/DataProvider';
import { AsyncMemorySettingKey } from 'shared/lib';
import { ScreenLayout, SwitchElement, Text, TEXT_TAGS } from 'shared/ui';
import { COLORS } from 'shared/themes';
import { SOUND_SETTINGS_FIELDS } from '../../lib';
import { useSettings } from '../../model';

function Sound() {
  const { t } = useTranslation();

  const { sound } = useData({
    Context: ApplicationConfigContext,
  });

  const styles = useStyleSheet(styleSheet);

  const { handleChangeBase } = useSettings({
    hasAutoSave: true,
    asyncMemoryKey: AsyncMemorySettingKey.Sound,
  });

  const titleKey =
    Platform.OS === 'web' ? 'settings:sound.web' : 'settings:sound';

  return (
    <ScreenLayout style={styles.container}>
      <Header title={t(titleKey)} />
      {Platform.OS === 'web' && (
        <Text category={TEXT_TAGS.p2} style={styles.webHint}>
          {t('settings:sound.web.hint')}
        </Text>
      )}
      <View style={styles.form}>
        {SOUND_SETTINGS_FIELDS.map((setting) => (
          <SwitchElement
            key={setting.value}
            name={`settings:${setting.name}`}
            value={sound?.[setting.value]}
            onValueChange={(value) => {
              handleChangeBase<boolean>(value, setting.value);
            }}
          />
        ))}
      </View>
    </ScreenLayout>
  );
}

const styleSheet = StyleService.create({
  container: {
    flex: 1,
  },
  webHint: {
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 8,
    color: COLORS.SpbSky1,
    lineHeight: 20,
    textAlign: 'center',
  },
  form: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 16,
    padding: 14,
  },
  element: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export default Sound;
