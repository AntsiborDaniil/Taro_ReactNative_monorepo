import { View } from 'react-native';
import { StyleService, useStyleSheet } from '@ui-kitten/components';
import { useTranslation } from 'react-i18next';
import { Header } from 'features/header';
import { ScreenLayout } from 'shared/ui';
import LanguagePickerBody from './LanguagePickerBody';

function Language() {
  const { t } = useTranslation();
  const styles = useStyleSheet(styleSheet);

  return (
    <ScreenLayout style={styles.container}>
      <Header title={t('settings:language')} />
      <View style={styles.body}>
        <LanguagePickerBody variant="screen" />
      </View>
    </ScreenLayout>
  );
}

const styleSheet = StyleService.create({
  container: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
});

export default Language;
