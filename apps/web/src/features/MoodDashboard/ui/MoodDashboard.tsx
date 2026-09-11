import { ReactElement, useEffect, useRef, useState } from 'react';
import {
  Platform,
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
  WEB_HOVER_TRANSITION,
} from 'shared/lib';
import { COLORS } from 'shared/themes';
import { AreaGraphs, EmptyResultsModal, Text } from 'shared/ui';
import { ModalsContext } from 'shared/ui/ModalsProvider';
import MoodProgress from './MoodProgress';
import { MoodMetricBoxes } from './MoodMetricBoxes';

export type MoodDashboardProps = {
  isWidget?: boolean;
  /** Горизонтальные поля снаружи блока; на главной 0 — отступ даёт родитель */
  horizontalInset?: number;
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

const DESIGN = {
  date: { color: 'transparent' },
  mood: { color: '#2658B7' },
  energy: { color: '#50A622' },
  stress: { color: '#AC2224' },
};

const GRAPH_KEYS = ['mood', 'energy', 'stress'] as const;

function MoodDashboard({
  isWidget,
  horizontalInset = 16,
}: MoodDashboardProps): ReactElement {
  const { t } = useTranslation('moodAndEnergy');
  const { t: tCore } = useTranslation('core');
  const [visible, setVisible] = useState(false);
  const [dateHovered, setDateHovered] = useState(false);

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
        <Text style={styles.emptyStubText}>{tCore('stub.emptyResults')}</Text>
      </View>
    );
  }

  const latest = displayData[displayData.length - 1];

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
        <>
          <View style={[styles.decorOrb, styles.decorOrbTop]} />
          <View style={[styles.decorOrb, styles.decorOrbBottom]} />
          <View style={styles.decorGrid} />
        </>
      )}
      {!isWidget && (
        <View style={styles.header}>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerEyebrow}>TAROT INSIGHTS</Text>
            <Text style={styles.headerTitle}>{t('name.mood')}</Text>
          </View>
          <View style={styles.dateActionWrapper}>
            <Pressable
              style={({ pressed }) => [
                styles.dateAction,
                dateHovered && styles.dateActionHover,
                pressed && styles.dateActionPressed,
              ]}
              onHoverIn={() => setDateHovered(true)}
              onHoverOut={() => setDateHovered(false)}
              onPress={() => setVisible((prevState) => !prevState)}
            >
              <Text style={styles.dateActionText}>
                {t(`datesPeriod.${dateMode}`)}
              </Text>
            </Pressable>

            {visible && (
              <View style={styles.dates}>
                <TouchableOpacity
                  style={styles.dateItem}
                  onPress={selectDateMode(MoodDisplayMode.Week)}
                >
                  <Text
                    style={[
                      styles.dateItemText,
                      dateMode === MoodDisplayMode.Week
                        ? styles.activeDate
                        : undefined,
                    ]}
                  >
                    {t(`datesPeriod.${MoodDisplayMode.Week}`)}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dateItem}
                  onPress={selectDateMode(MoodDisplayMode.Month)}
                >
                  <Text
                    style={[
                      styles.dateItemText,
                      dateMode === MoodDisplayMode.Month
                        ? styles.activeDate
                        : undefined,
                    ]}
                  >
                    {t(`datesPeriod.${MoodDisplayMode.Month}`)}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dateItem}
                  onPress={selectDateMode(MoodDisplayMode.Year)}
                >
                  <Text
                    style={[
                      styles.dateItemText,
                      dateMode === MoodDisplayMode.Year
                        ? styles.activeDate
                        : undefined,
                    ]}
                  >
                    {t(`datesPeriod.${MoodDisplayMode.Year}`)}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      )}
      {!isWidget && (
        <View style={styles.graphCard}>
          <View style={styles.graphGlow} />
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
      {!isWidget ? (
        <MoodMetricBoxes
          values={{
            mood: latest.mood ?? 0,
            energy: latest.energy ?? 0,
            stress: latest.stress ?? 0,
          }}
        />
      ) : null}
      <MoodProgress isWidget={isWidget} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    maxWidth: '100%',
    alignSelf: 'stretch',
    alignItems: 'stretch',
    backgroundColor: COLORS.Background,
    borderWidth: 1,
    borderColor: 'rgba(132, 176, 230, 0.16)',
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
    ...(Platform.OS === 'web'
      ? ({
          boxShadow:
            '0 0 0 1px rgba(132, 176, 230, 0.08), 0 12px 28px rgba(0, 0, 0, 0.2)',
        } as object)
      : {}),
  },
  emptyStub: {
    minHeight: 120,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  emptyStubText: {
    color: COLORS.Content,
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.85,
    ...(Platform.OS === 'web' ? ({ lineHeight: 22 } as object) : {}),
  },
  header: {
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingBottom: 8,
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(132, 176, 230, 0.14)',
  },
  headerTitleGroup: {
    gap: 2,
  },
  headerEyebrow: {
    color: 'rgba(191, 170, 255, 0.9)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.1,
  },
  headerTitle: {
    color: '#F3F6FF',
    fontSize: 18,
    fontWeight: '700',
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
    borderColor: 'rgba(132, 176, 230, 0.28)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    ...WEB_HOVER_TRANSITION,
  },
  dateActionText: {
    color: COLORS.Content,
    fontSize: 15,
    fontWeight: '600',
    ...(Platform.OS === 'web' ? ({ lineHeight: 20 } as object) : {}),
  },
  dateActionHover:
    Platform.OS === 'web'
      ? ({
          backgroundColor: 'rgba(255, 255, 255, 0.06)',
        } as object)
      : {},
  dateActionPressed: {
    opacity: 0.85,
  },
  dates: {
    backgroundColor: COLORS.Background2,
    padding: 10,
    position: 'absolute',
    gap: 6,
    bottom: -130,
    right: 0,
    borderRadius: 12,
    zIndex: 100,
    borderWidth: 1,
    borderColor: 'rgba(132, 176, 230, 0.26)',
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 10px 24px rgba(0, 0, 0, 0.22)',
        } as object)
      : {}),
  },
  dateItem: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  dateItemText: {
    color: COLORS.Content,
    fontSize: 14,
    fontWeight: '500',
  },
  activeDate: {
    color: COLORS.Primary,
    fontWeight: '700',
    ...(Platform.OS === 'web'
      ? ({
          textDecorationLine: 'underline',
        } as object)
      : {}),
  },
  graphCard: {
    marginTop: 4,
    marginHorizontal: 12,
    borderRadius: 14,
    paddingTop: 6,
    paddingBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(132, 176, 230, 0.14)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    overflow: 'hidden',
    position: 'relative',
  },
  graphGlow: {
    position: 'absolute',
    width: 220,
    height: 120,
    borderRadius: 999,
    right: -40,
    top: -35,
    backgroundColor: 'rgba(246, 192, 27, 0.12)',
    ...(Platform.OS === 'web'
      ? ({
          filter: 'blur(20px)',
        } as object)
      : {}),
  },
  decorOrb: {
    position: 'absolute',
    borderRadius: 999,
    zIndex: 0,
  },
  decorOrbTop: {
    width: 170,
    height: 170,
    top: -95,
    right: -46,
    backgroundColor: 'rgba(246, 192, 27, 0.16)',
    ...(Platform.OS === 'web'
      ? ({
          filter: 'blur(16px)',
        } as object)
      : {}),
  },
  decorOrbBottom: {
    width: 150,
    height: 150,
    bottom: -92,
    left: -54,
    backgroundColor: 'rgba(47, 186, 216, 0.14)',
    ...(Platform.OS === 'web'
      ? ({
          filter: 'blur(14px)',
        } as object)
      : {}),
  },
  decorGrid: {
    position: 'absolute',
    right: 20,
    bottom: 22,
    width: 84,
    height: 84,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(246, 192, 27, 0.16)',
    backgroundColor: 'rgba(246, 192, 27, 0.03)',
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.02)',
        } as object)
      : {}),
  },
});

export default MoodDashboard;
