import { StyleSheet, View } from 'react-native';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Header } from 'features/header';
import { COLORS } from 'shared/themes';
import { ScreenLayout, Text, TEXT_TAGS } from 'shared/ui';
import MeditativeVisualizer from './MeditativeVisualizer';
import SelectCategory from './SelectCategory';

function Affirmations(): ReactElement {
  const { t } = useTranslation();

  return (
    <ScreenLayout>
      <Header title={t('affirmations:affirmations')} />

      <View style={styles.container}>
        <Text style={styles.label} category={TEXT_TAGS.label}>
          {t('affirmations:tomorrowAffirmation')}
        </Text>
        <MeditativeVisualizer />
        <SelectCategory />
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  label: {
    color: COLORS.SpbSky2,
    marginHorizontal: 12,
  },
});

export default Affirmations;
