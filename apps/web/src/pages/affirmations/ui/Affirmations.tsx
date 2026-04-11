import { StyleSheet, View } from 'react-native';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Header } from 'features/header';
import { COLORS } from 'shared/themes';
import { ScreenLayout, Text, TEXT_TAGS } from 'shared/ui';
import MeditativeVisualizer from './MeditativeVisualizer';
import SelectCategory from './SelectCategory';
import { useAffirmationsLayout } from './useAffirmationsLayout';

const affirmationsHeaderTitle = {
  mobile: { fontSize: 22 },
};

function Affirmations(): ReactElement {
  const { t } = useTranslation();
  const layout = useAffirmationsLayout();

  return (
    <ScreenLayout>
      <Header
        title={t('affirmations:affirmations')}
        titleStyle={
          layout.isNarrow ? affirmationsHeaderTitle.mobile : undefined
        }
      />

      <View style={styles.root}>
        <View
          style={[
            styles.column,
            {
              width: layout.contentWidth,
              maxWidth: '100%',
              alignSelf: 'center',
              paddingHorizontal: layout.padding,
              gap: layout.sectionGap,
            },
          ]}
        >
          <Text
            style={[
              styles.label,
              {
                fontSize: layout.labelFontSize,
                lineHeight: Math.round(layout.labelFontSize * 1.35),
              },
            ]}
            category={TEXT_TAGS.label}
          >
            {t('affirmations:tomorrowAffirmation')}
          </Text>
          <MeditativeVisualizer visualSize={layout.visualSize} />
        </View>
        <SelectCategory layout={layout} />
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    position: 'relative',
  },
  column: {
    flex: 1,
  },
  label: {
    color: COLORS.SpbSky2,
    textAlign: 'center',
  },
});

export default Affirmations;
