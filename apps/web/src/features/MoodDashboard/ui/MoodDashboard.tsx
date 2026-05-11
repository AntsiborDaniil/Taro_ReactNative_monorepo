import { ReactElement, useEffect, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { MoodAndEnergyContext } from 'entities/moodAndEnergy';
import { useTranslation } from 'react-i18next';
import { MoodDisplayMode } from 'shared/api';
import type { TMoodItem } from 'shared/api';
import { useData } from 'shared/DataProvider';
import { getMonthDate, getMonthDayDate, getWeekDate } from 'shared/lib';
import { COLORS } from 'shared/themes';
import { AreaGraphs, EmptyResultsModal, Text } from 'shared/ui';
import { ModalsContext } from 'shared/ui/ModalsProvider';
import MoodProgress from './MoodProgress';

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

function MoodDashboard({
  isWidget,
  horizontalInset = 16,
}: MoodDashboardProps): ReactElement {
  const { t } = useTranslation('moodAndEnergy');
  const { t: tCore } = useTranslation('core');
  const { width: winW } = useWindowDimensions();
  const isCompact = winW < (isWidget ? 460 : 760);
  const [visible, setVisible] = useState(false);
  const [hoveredMoodChip, setHoveredMoodChip] = useState<string | null>(null);
  const [dateHovered, setDateHovered] = useState(false);

  const { displayData, moodDataReady, updateTodayMood, setDateMode, dateMode } =
    useData({
      Context: MoodAndEnergyContext,
    });

  const { showModal } = useData({ Context: ModalsContext });
  const emptyModalShownRef = useRef(false);

  const [usedMoods, setUsedMoods] = useState<Array<keyof TMoodItem>>([
    'stress',
    'energy',
    'mood',
  ]);

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

  const switchMood = (moodName: keyof TMoodItem) => {
    setUsedMoods((prevState) => {
      if (prevState.includes(moodName)) {
        return prevState.filter((m) => m !== moodName);
      }

      return [...prevState, moodName];
    });
  };

  const selectDateMode = (dateMode: MoodDisplayMode) => () => {
    setVisible(false);
    setDateMode?.(dateMode);
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
        <Text style={styles.emptyStubText}>
          {tCore('stub.emptyResults')}
        </Text>
      </View>
    );
  }

  const moodsActionConfig: Array<{
    name: keyof TMoodItem;
    activeStyle: object;
    translation: string;
  }> = [
    {
      name: 'mood',
      activeStyle: styles.moodActionMood,
      translation: t('name.mood'),
    },
    {
      name: 'energy',
      activeStyle: styles.moodActionEnergy,
      translation: t('name.energy'),
    },
    {
      name: 'stress',
      activeStyle: styles.moodActionStress,
      translation: t('name.stress'),
    },
  ];

  return (
    <>
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
              yAxisKeys={usedMoods}
              xAxisKey="date"
              formatYLabel={() => {
                return '';
              }}
              design={DESIGN}
              {...CONFIG[dateMode ?? MoodDisplayMode.Week]}
            />
          </View>
        )}
        <View
          style={[
            styles.moodsActions,
            isWidget && styles.moodsActionsWidget,
            !isWidget && styles.moodsActionsScreen,
            isCompact && styles.moodsActionsCompact,
            {
              paddingHorizontal: isWidget
                ? Math.min(18, Math.max(12, winW * 0.035))
                : Math.min(22, Math.max(16, winW * 0.04)),
            },
          ]}
        >
          {!isWidget && (
            <View style={styles.chipsHeader}>
              <Text style={styles.chipsHeaderText}>{t('progress')}</Text>
            </View>
          )}
          {moodsActionConfig.map((item) => (
            <Pressable
              key={item.name}
              onHoverIn={() => setHoveredMoodChip(item.name)}
              onHoverOut={() => setHoveredMoodChip(null)}
              style={({ pressed }) => [
                styles.moodAction,
                isWidget && styles.moodActionWidget,
                !isWidget && styles.moodActionScreen,
                isCompact && styles.moodActionCompact,
                usedMoods.includes(item.name) ? item.activeStyle : undefined,
                hoveredMoodChip === item.name &&
                  (isWidget ? styles.moodChipHoverWidget : styles.moodChipHoverScreen),
                pressed && styles.moodChipPressed,
              ]}
              onPress={() => {
                switchMood(item.name);
              }}
            >
              <Text
                style={[
                  styles.moodActionText,
                  isWidget && styles.moodActionTextWidget,
                  !isWidget && styles.moodActionTextScreen,
                ]}
                category="label"
                numberOfLines={1}
              >
                {item.translation}
              </Text>
            </Pressable>
          ))}
        </View>
        <MoodProgress isWidget={isWidget} />
      </View>
    </>
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
  moodsActions: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    paddingTop: 12,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(132, 176, 230, 0.14)',
  },
  moodsActionsWidget: {
    gap: 10,
    paddingTop: 16,
    paddingBottom: 18,
  },
  moodsActionsScreen: {
    gap: 12,
    paddingTop: 16,
    paddingBottom: 16,
  },
  moodsActionsCompact: {
    gap: 10,
  },
  moodAction: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '31%',
    minWidth: 0,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(58, 79, 114, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    ...(globalThis?.window
      ? ({
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.14)',
        } as object)
      : {}),
  },
  moodActionWidget: {
    paddingHorizontal: 8,
    paddingVertical: 14,
    minHeight: 52,
  },
  moodActionScreen: {
    minHeight: 54,
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  moodActionCompact: {
    flexBasis: '100%',
  },
  moodChipHoverScreen:
    Platform.OS === 'web'
      ? ({
          borderColor: 'rgba(255, 255, 255, 0.26)',
        } as object)
      : {},
  moodChipHoverWidget:
    Platform.OS === 'web'
      ? ({
          borderColor: 'rgba(255, 255, 255, 0.22)',
        } as object)
      : {},
  moodChipPressed: {
    opacity: 0.9,
  },
  moodActionText: {
    color: '#F5F7FF',
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    textAlign: 'center',
    width: '100%',
    ...(Platform.OS === 'web' ? ({ whiteSpace: 'nowrap' } as object) : {}),
    ...(Platform.OS === 'android'
      ? { includeFontPadding: false, textAlignVertical: 'center' }
      : {}),
  },
  moodActionTextWidget: {
    fontSize: 16,
  },
  moodActionTextScreen: {
    fontSize: 16,
    letterSpacing: 0.2,
  },
  moodActionMood: {
    backgroundColor: DESIGN.mood.color,
    borderColor: '#4A7FE6',
  },
  moodActionEnergy: {
    backgroundColor: DESIGN.energy.color,
    borderColor: '#7ED04F',
  },
  moodActionStress: {
    backgroundColor: DESIGN.stress.color,
    borderColor: '#E35557',
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
    backgroundColor: 'rgba(109, 82, 224, 0.22)',
    ...(Platform.OS === 'web'
      ? ({
          filter: 'blur(20px)',
        } as object)
      : {}),
  },
  chipsHeader: {
    width: '100%',
    marginBottom: 2,
  },
  chipsHeaderText: {
    color: 'rgba(195, 211, 248, 0.85)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.35,
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
    backgroundColor: 'rgba(106, 83, 214, 0.24)',
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
    backgroundColor: 'rgba(62, 117, 205, 0.2)',
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
    borderColor: 'rgba(181, 166, 235, 0.18)',
    backgroundColor: 'rgba(170, 148, 250, 0.04)',
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.02)',
        } as object)
      : {}),
  },
});

export default MoodDashboard;
