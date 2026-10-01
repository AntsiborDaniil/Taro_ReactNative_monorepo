import { ReactElement, useEffect, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { MoodAndEnergyContext } from 'entities/moodAndEnergy';
import { useTranslation } from 'react-i18next';
import { MoodDisplayMode } from 'shared/api';
import { useData } from 'shared/DataProvider';
import {
  getMonthDate,
  getMonthDayDate,
  getWeekDate,
} from 'shared/lib';
import { DS_COLORS, dsWebTransition } from 'shared/themes/ds';
import { AreaGraphs, EmptyResultsModal, Text, TEXT_TAGS, TEXT_WEIGHT } from 'shared/ui';
import { ModalsContext } from 'shared/ui/ModalsProvider';
import MoodProgress from './MoodProgress';

export type MoodDashboardProps = {
  isWidget?: boolean;
  /** Горизонтальные поля снаружи блока; на главной 0 — отступ даёт родитель */
  horizontalInset?: number;
  /** Блок с прогрессом и картой дня; на странице состояния он отдельной секцией */
  showProgress?: boolean;
};

const CONFIG = {
  [MoodDisplayMode.Year]: {
    formatXLabel: getMonthDate,
  },
  [MoodDisplayMode.Month]: {
    formatXLabel: getMonthDayDate,
  },
  [MoodDisplayMode.Week]: {
    formatXLabel: getWeekDate,
  },
};

/** DS: единственные три роли для серий графика — accent/calm/alarm. */
const DESIGN = {
  date: { color: 'transparent' },
  mood: { color: DS_COLORS.accent400 },
  energy: { color: DS_COLORS.calm500 },
  stress: { color: DS_COLORS.alarm600 },
};

const GRAPH_KEYS = ['mood', 'energy', 'stress'] as const;

function MoodDashboard({
  isWidget,
  horizontalInset = 16,
  showProgress = true,
}: MoodDashboardProps): ReactElement {
  const { t } = useTranslation('moodAndEnergy');
  const { t: tCore } = useTranslation('core');
  const [visible, setVisible] = useState(false);

  const { displayData, moodDataReady, setDateMode, dateMode } = useData({
    Context: MoodAndEnergyContext,
  });

  const { showModal } = useData({ Context: ModalsContext });
  const emptyModalShownRef = useRef(false);

  useEffect(() => {
    if (!moodDataReady) {
      return;
    }

    if (displayData?.length) {
      emptyModalShownRef.current = false;
      return;
    }

    if (emptyModalShownRef.current || !showModal) {
      return;
    }

    emptyModalShownRef.current = true;
    showModal(<EmptyResultsModal />);
  }, [displayData?.length, moodDataReady, showModal]);

  const selectDateMode = (nextMode: MoodDisplayMode) => () => {
    setVisible(false);
    setDateMode?.(nextMode);
  };

  if (!displayData?.length) {
    return (
      <View
        style={[
          styles.wrapper,
          isWidget && styles.wrapperWidget,
          !isWidget && styles.wrapperScreen,
          { marginHorizontal: horizontalInset },
          styles.emptyStub,
        ]}
      >
        <Text category={TEXT_TAGS.p2} style={styles.emptyStubText}>
          {tCore('stub.emptyResults')}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.wrapper,
        isWidget && styles.wrapperWidget,
        !isWidget && styles.wrapperScreen,
        { marginHorizontal: horizontalInset },
      ]}
    >
      {!isWidget && (
        <View style={styles.header}>
          <View style={styles.headerTitleGroup}>
            <Text category={TEXT_TAGS.label} style={styles.headerEyebrow}>
              {t('chart.eyebrow')}
            </Text>
            <Text
              category={TEXT_TAGS.h5}
              weight={TEXT_WEIGHT.semibold}
              style={styles.headerTitle}
            >
              {t('chart.title')}
            </Text>
          </View>
          <View style={styles.dateActionWrapper}>
            <Pressable
              style={({ pressed, ...rest }: { pressed: boolean; hovered?: boolean }) => [
                styles.dateAction,
                rest.hovered && styles.dateActionHover,
                pressed && styles.dateActionPressed,
              ]}
              onPress={() => setVisible((prevState) => !prevState)}
            >
              <Text category={TEXT_TAGS.label} style={styles.dateActionText}>
                {t(`datesPeriod.${dateMode}`)}
              </Text>
            </Pressable>

            {visible && (
              <View style={styles.dates}>
                {[MoodDisplayMode.Week, MoodDisplayMode.Month, MoodDisplayMode.Year].map(
                  (mode) => (
                    <TouchableOpacity
                      key={mode}
                      style={styles.dateItem}
                      onPress={selectDateMode(mode)}
                    >
                      <Text
                        category={TEXT_TAGS.label}
                        weight={dateMode === mode ? TEXT_WEIGHT.bold : undefined}
                        style={[
                          styles.dateItemText,
                          dateMode === mode && styles.activeDate,
                        ]}
                      >
                        {t(`datesPeriod.${mode}`)}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>
            )}
          </View>
        </View>
      )}
      {!isWidget && (
        <View style={styles.graphCard}>
          <AreaGraphs
            data={displayData ?? []}
            yAxisKeys={[...GRAPH_KEYS]}
            xAxisKey="date"
            formatYLabel={() => {
              return '';
            }}
            design={DESIGN}
            {...CONFIG[dateMode ?? MoodDisplayMode.Week]}
          />
        </View>
      )}
      {!isWidget && (
        <View style={styles.legend}>
          {GRAPH_KEYS.map((key) => (
            <View key={key} style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: DESIGN[key].color },
                ]}
              />
              <Text category={TEXT_TAGS.label} style={styles.legendLabel}>
                {t(`name.${key}`)}
              </Text>
            </View>
          ))}
        </View>
      )}
      {showProgress && <MoodProgress isWidget={isWidget} />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    maxWidth: '100%',
    alignSelf: 'stretch',
    alignItems: 'stretch',
    backgroundColor: DS_COLORS.ground700,
    borderWidth: 1,
    borderColor: DS_COLORS.ground600,
    borderRadius: 16,
    paddingTop: 10,
    paddingBottom: 10,
    gap: 8,
    overflow: 'hidden',
  },
  wrapperWidget: {
    paddingTop: 12,
    paddingBottom: 10,
  },
  wrapperScreen: {
    paddingTop: 8,
    paddingBottom: 8,
    borderRadius: 18,
  },
  emptyStub: {
    minHeight: 120,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  emptyStubText: {
    color: DS_COLORS.ink100,
    textAlign: 'center',
  },
  header: {
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingBottom: 8,
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: DS_COLORS.ground600,
  },
  headerTitleGroup: {
    gap: 2,
  },
  headerEyebrow: {
    color: DS_COLORS.accent400,
  },
  headerTitle: {
    color: DS_COLORS.ink50,
  },
  dateActionWrapper: {
    position: 'relative',
  },
  dateAction: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DS_COLORS.ground600,
    backgroundColor: DS_COLORS.ground800,
    ...dsWebTransition,
  },
  dateActionText: {
    color: DS_COLORS.ink50,
  },
  dateActionHover: {
    borderColor: DS_COLORS.accent400,
  },
  dateActionPressed: {
    opacity: 0.85,
  },
  dates: {
    backgroundColor: DS_COLORS.ground800,
    padding: 10,
    position: 'absolute',
    gap: 6,
    bottom: -130,
    right: 0,
    borderRadius: 12,
    zIndex: 100,
    borderWidth: 1,
    borderColor: DS_COLORS.ground600,
  },
  dateItem: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  dateItemText: {
    color: DS_COLORS.ink100,
  },
  activeDate: {
    color: DS_COLORS.accent400,
  },
  graphCard: {
    marginTop: 4,
    marginHorizontal: 12,
    borderRadius: 14,
    paddingTop: 6,
    paddingBottom: 4,
    borderWidth: 1,
    borderColor: DS_COLORS.ground600,
    backgroundColor: DS_COLORS.ground800,
    overflow: 'hidden',
    position: 'relative',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 14,
    paddingTop: 2,
    paddingBottom: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  legendLabel: {
    color: DS_COLORS.ink100,
  },
});

export default MoodDashboard;
