import { StyleSheet, View } from 'react-native';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Header } from 'features/header';
import { COLORS } from 'shared/themes';
import { ScreenLayout, Text, TEXT_TAGS, TEXT_WEIGHT } from 'shared/ui';
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
          <View style={styles.statusCard}>
            <View style={styles.statusDot} />
            <Text
              style={[
                styles.statusTitle,
                {
                  fontSize: layout.labelFontSize,
                  lineHeight: Math.round(layout.labelFontSize * 1.2),
                },
              ]}
              category={TEXT_TAGS.h4}
              weight={TEXT_WEIGHT.medium}
            >
              {t('affirmations:tomorrowAffirmation')}
            </Text>
            <Text category={TEXT_TAGS.p2} style={styles.statusSubtitle}>
              {t('affirmations:categoryHint')}
            </Text>
          </View>
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
  statusCard: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: COLORS.Primary,
    marginBottom: 2,
  },
  statusTitle: {
    color: COLORS.Content,
    textAlign: 'center',
  },
  statusSubtitle: {
    color: 'rgba(255,255,255,0.66)',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default Affirmations;
