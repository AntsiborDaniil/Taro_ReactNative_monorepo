import { ReactElement } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { MoodAndEnergyContext } from 'entities/moodAndEnergy';
import { useTranslation } from 'react-i18next';
import { Header } from 'features/header';
import { MoodDashboard, MoodProgress } from 'features/MoodDashboard';
import type { TMoodItem } from 'shared/api';
import { useData } from 'shared/DataProvider';
import { DS_COLORS } from 'shared/themes/ds';
import { ScreenLayout, Text, TEXT_TAGS, TEXT_WEIGHT } from 'shared/ui';
import { InputSlider } from 'shared/ui/Slider/Slider';

import MoodStepHeader from './MoodStepHeader';
import { useMoodAndEnergyLayout } from './useMoodAndEnergyLayout';

export type MoodAndEnergyScreenProps = {};

const METRICS: Array<{
  key: keyof Pick<TMoodItem, 'mood' | 'energy' | 'stress'>;
}> = [{ key: 'mood' }, { key: 'energy' }, { key: 'stress' }];

const SCALE_MIN = 0;
const SCALE_MAX = 10;

function MoodAndEnergyScreen(_props: MoodAndEnergyScreenProps): ReactElement {
  const { t } = useTranslation('moodAndEnergy');
  const layout = useMoodAndEnergyLayout();

  const { moodDataReady, todayProgress, updateTodayMood } = useData({
    Context: MoodAndEnergyContext,
  });

  const todayValues = todayProgress?.values;
  const filledCount = todayProgress?.filledValuesCount ?? 0;
  const totalCount = todayProgress?.allValuesCount ?? METRICS.length;

  return (
    <ScreenLayout>
      <Header title={t('core:yourState')} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollInner,
          { paddingBottom: layout.scrollBottomPad },
        ]}
      >
        <View
          style={[
            styles.column,
            {
              width: '100%',
              maxWidth: '100%',
              alignSelf: 'stretch',
              paddingHorizontal: layout.padding,
            },
          ]}
        >
          <View style={styles.intro}>
            <Text
              category={TEXT_TAGS.label}
              weight={TEXT_WEIGHT.semibold}
              style={styles.introEyebrow}
            >
              {t('intro.eyebrow')}
            </Text>
            <Text
              category={TEXT_TAGS.h4}
              weight={TEXT_WEIGHT.semibold}
              style={styles.introTitle}
            >
              {t('intro.title')}
            </Text>
            <Text category={TEXT_TAGS.p2} style={styles.introBody}>
              {t('intro.body')}
            </Text>
          </View>

          <View style={styles.section}>
            <MoodStepHeader
              step={1}
              title={t('step.assess.title')}
              hint={t('step.assess.hint')}
              badge={t('filled', { filled: filledCount, total: totalCount })}
            />
            <View style={styles.sliders}>
              {METRICS.map((metric) => (
                <InputSlider
                  key={metric.key}
                  label={t(`name.${metric.key}`)}
                  hint={t(`hint.${metric.key}`)}
                  value={todayValues?.[metric.key] ?? SCALE_MIN}
                  unset={todayValues?.[metric.key] == null}
                  minValue={SCALE_MIN}
                  maxValue={SCALE_MAX}
                  step={1}
                  onChange={(value: number) =>
                    updateTodayMood?.({ name: metric.key, value })
                  }
                />
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <MoodStepHeader
              step={2}
              title={t('step.card.title')}
              hint={t('step.card.hint')}
            />
            <MoodProgress />
          </View>

          {moodDataReady && (
            <View style={styles.section}>
              <MoodStepHeader
                step={3}
                title={t('step.chart.title')}
                hint={t('step.chart.hint')}
              />
              <MoodDashboard horizontalInset={0} showProgress={false} />
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scrollInner: {
    flexGrow: 1,
    width: '100%',
    alignSelf: 'stretch',
    paddingTop: 8,
  },
  column: {
    width: '100%',
    gap: 22,
  },
  intro: {
    gap: 4,
    paddingHorizontal: 2,
  },
  introEyebrow: {
    color: DS_COLORS.accent400,
    letterSpacing: 1.1,
  },
  introTitle: {
    color: DS_COLORS.ink50,
  },
  introBody: {
    color: DS_COLORS.ink100,
    lineHeight: 20,
    maxWidth: 560,
  },
  section: {
    gap: 10,
  },
  sliders: {
    gap: 12,
  },
});

export default MoodAndEnergyScreen;
