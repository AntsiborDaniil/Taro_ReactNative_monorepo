import { ReactElement, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text as RNText,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { MoodAndEnergyContext } from 'entities/moodAndEnergy';
import { useTranslation } from 'react-i18next';
import { MoodDisplayMode } from 'shared/api';
import { useData } from 'shared/DataProvider';
import { getMonthDate, getMonthDayDate, getWeekDate } from 'shared/lib';
import { COLORS } from 'shared/themes';
import { AreaGraphs, Text } from 'shared/ui';
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
  mood: { color: '#2658B7' },
  energy: { color: '#50A622' },
  stress: { color: '#AC2224' },
};

function MoodDashboard({
  isWidget,
  horizontalInset = 16,
}: MoodDashboardProps): ReactElement | null {
  const { t } = useTranslation('moodAndEnergy');
  const { width: winW } = useWindowDimensions();
  const [visible, setVisible] = useState(false);
  const [hoveredMoodChip, setHoveredMoodChip] = useState<string | null>(null);
  const [dateHovered, setDateHovered] = useState(false);

  const { displayData, updateTodayMood, setDateMode, dateMode } = useData({
    Context: MoodAndEnergyContext,
  });

  const [usedMoods, setUsedMoods] = useState(['stress', 'energy', 'mood']);

  const switchMood = (moodName: string) => {
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

  if (!displayData?.length) return null;

  const moodsActionConfig = [
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
          <View style={styles.header}>
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
                    onPress={selectDateMode(MoodDisplayMode.Week)}
                  >
                    <Text
                      style={
                        dateMode === MoodDisplayMode.Week
                          ? styles.activeDate
                          : undefined
                      }
                    >
                      {t(`datesPeriod.${MoodDisplayMode.Week}`)}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={selectDateMode(MoodDisplayMode.Month)}
                  >
                    <Text
                      style={
                        dateMode === MoodDisplayMode.Month
                          ? styles.activeDate
                          : undefined
                      }
                    >
                      {t(`datesPeriod.${MoodDisplayMode.Month}`)}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={selectDateMode(MoodDisplayMode.Year)}
                  >
                    <Text
                      style={
                        dateMode === MoodDisplayMode.Year
                          ? styles.activeDate
                          : undefined
                      }
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
        )}
        <View
          style={[
            styles.moodsActions,
            isWidget && styles.moodsActionsWidget,
            !isWidget && styles.moodsActionsScreen,
            {
              paddingHorizontal: isWidget
                ? Math.min(18, Math.max(12, winW * 0.035))
                : Math.min(22, Math.max(16, winW * 0.04)),
            },
          ]}
        >
          {moodsActionConfig.map((item) => (
            <Pressable
              key={item.name}
              onHoverIn={() => setHoveredMoodChip(item.name)}
              onHoverOut={() => setHoveredMoodChip(null)}
              style={({ pressed }) => [
                styles.moodAction,
                isWidget && styles.moodActionWidget,
                !isWidget && styles.moodActionScreen,
                usedMoods.includes(item.name) ? item.activeStyle : undefined,
                hoveredMoodChip === item.name &&
                  (isWidget ? styles.moodChipHoverWidget : styles.moodChipHoverScreen),
                pressed && styles.moodChipPressed,
              ]}
              onPress={() => {
                switchMood(item.name);
              }}
            >
              <RNText
                style={[
                  styles.moodActionText,
                  isWidget && styles.moodActionTextWidget,
                  !isWidget && styles.moodActionTextScreen,
                ]}
                numberOfLines={isWidget ? 2 : 1}
              >
                {item.translation}
              </RNText>
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
    boxShadow: '0 0 20px rgba(67, 35, 212, 1)',
    borderRadius: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  wrapperWidget: {
    paddingTop: 12,
    paddingBottom: 10,
  },
  wrapperScreen: {
    paddingTop: 4,
    paddingBottom: 4,
    borderRadius: 18,
    ...(Platform.OS === 'web'
      ? ({
          boxShadow:
            '0 0 0 1px rgba(132, 176, 230, 0.12), 0 12px 40px rgba(0, 0, 0, 0.35)',
        } as object)
      : {}),
  },
  moodsActions: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
    paddingTop: 18,
    paddingBottom: 18,
  },
  moodsActionsWidget: {
    gap: 10,
    paddingTop: 16,
    paddingBottom: 18,
  },
  moodsActionsScreen: {
    gap: 12,
    paddingTop: 22,
    paddingBottom: 22,
  },
  moodAction: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingHorizontal: 8,
    backgroundColor: COLORS.SpbSky4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    ...(globalThis?.window
      ? ({
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.22)',
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
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  moodChipHoverScreen:
    Platform.OS === 'web'
      ? ({ transform: [{ translateY: -2 }] } as object)
      : {},
  moodChipHoverWidget:
    Platform.OS === 'web'
      ? ({ transform: [{ translateY: -1 }] } as object)
      : {},
  moodChipPressed: {
    opacity: 0.9,
  },
  moodActionText: {
    color: '#F5F7FF',
    fontSize: 22,
    fontFamily: 'Montserrat-SemiBold',
    textAlign: 'center',
    width: '100%',
    ...(Platform.OS === 'web' ? ({ lineHeight: 22 } as object) : {}),
    ...(Platform.OS === 'android'
      ? { includeFontPadding: false, textAlignVertical: 'center' }
      : {}),
  },
  moodActionTextWidget: {
    fontSize: 22,
    ...(Platform.OS === 'web' ? ({ lineHeight: 22 } as object) : {}),
  },
  moodActionTextScreen: {
    fontSize: 22,
    letterSpacing: 0.2,
    ...(Platform.OS === 'web' ? ({ lineHeight: 22 } as object) : {}),
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
    justifyContent: 'flex-end',
    paddingTop: 12,
    paddingBottom: 4,
    alignItems: 'flex-end',
  },
  dateActionWrapper: {
    position: 'relative',
  },
  dateAction: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    minHeight: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
    borderRadius: 12,
  },
  dateActionText: {
    color: COLORS.Content,
    fontSize: 22,
    fontWeight: '600',
    ...(Platform.OS === 'web' ? ({ lineHeight: 22 } as object) : {}),
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
    padding: 16,
    position: 'absolute',
    gap: 8,
    bottom: -124,
    left: -8,
    borderRadius: 16,
    zIndex: 100,
  },
  activeDate: {
    color: COLORS.Primary,
  },
});

export default MoodDashboard;
