import { View } from 'react-native';
import { StyleService, useStyleSheet } from '@ui-kitten/components';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { useTranslation } from 'react-i18next';
import { Header } from 'features/header';
import { useData } from 'shared/DataProvider';
import { AsyncMemorySettingKey } from 'shared/lib';
import { ScreenLayout, SwitchElement } from 'shared/ui';
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

  return (
    <ScreenLayout style={styles.container}>
      <Header title={t('settings:sound')} />
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
