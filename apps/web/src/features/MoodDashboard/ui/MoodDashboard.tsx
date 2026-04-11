import { ReactElement, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
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

function MoodDashboard({ isWidget }: MoodDashboardProps): ReactElement | null {
  const { t } = useTranslation('moodAndEnergy');
  const [visible, setVisible] = useState(false);

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
      <View style={styles.wrapper}>
        {!isWidget && (
          <View style={styles.header}>
            <View style={styles.dateActionWrapper}>
              <TouchableOpacity
                style={styles.dateAction}
                onPress={() => setVisible((prevState) => !prevState)}
              >
                <Text>{t(`datesPeriod.${dateMode}`)}</Text>
              </TouchableOpacity>

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
        <View style={styles.moodsActions}>
          {moodsActionConfig.map((item) => (
            <TouchableOpacity
              key={item.name}
              style={[
                styles.moodAction,
                usedMoods.includes(item.name) ? item.activeStyle : undefined,
              ]}
              onPress={() => {
                switchMood(item.name);
              }}
            >
              <Text style={styles.moodActionText}>{item.translation}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <MoodProgress isWidget={isWidget} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: COLORS.Background,
    boxShadow: '0 0 20px rgba(67, 35, 212, 1)',
    borderRadius: 16,
    marginHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  moodsActions: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,
  },
  moodAction: {
    minWidth: 130,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: COLORS.SpbSky4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    ...(globalThis?.window
      ? ({
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.22)',
        } as object)
      : {}),
  },
  moodActionText: {
    color: '#F5F7FF',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: 600,
    textAlign: 'center',
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
    paddingTop: 8,
    alignItems: 'flex-end',
  },
  dateActionWrapper: {
    position: 'relative',
  },
  dateAction: {
    padding: 4,
    paddingRight: 16,
    paddingBottom: 0,
    width: 100,
    height: 32,
    alignItems: 'flex-end',
    justifyContent: 'center',
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
