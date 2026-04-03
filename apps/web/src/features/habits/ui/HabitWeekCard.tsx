import { useMemo, useRef } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ProgressBar } from '@ui-kitten/components';
import { HabitsContext } from 'entities/habits';
import { useTranslation } from 'react-i18next';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useData } from 'shared/DataProvider';
import { Checked, CrossIcon, ReverseIcon } from 'shared/icons';
import {
  getCurrentWeekBounds,
  getDateISO,
  getHabitDayProgress,
  getLocalizedWeekdays,
} from 'shared/lib';
import { COLORS } from 'shared/themes';
import { HabitType, INegativeHabit, THabit } from 'shared/types';
import { Text, TEXT_TAGS, TEXT_WEIGHT } from 'shared/ui';

type HabitWeekCardProps = {
  habit: THabit;
};

function HabitWeekCard({ habit }: HabitWeekCardProps) {
  const { fillInSimpleHabit, deleteHabit, resetHabitProgress } = useData({
    Context: HabitsContext,
  });

  const { t, i18n } = useTranslation();

  const { days } = getCurrentWeekBounds();

  const weekDays = getLocalizedWeekdays(i18n.language);

  const isAutoFillEnabled =
    habit.type === HabitType.QuitNegative &&
    (habit as INegativeHabit).isAutoFillEnabled;

  const needToFillDays = useMemo(() => {
    return days.reduce((acc: number[], day, index) => {
      const isNeed =
        ((habit.type === HabitType.BuildPositive &&
          habit.frequencyDays.includes(index)) ||
          habit.type === HabitType.QuitNegative) &&
        !!habit.startDate &&
        day.getTime() >= new Date(habit.startDate).getTime();

      if (!isNeed) {
        return acc;
      }

      return [...acc, index];
    }, []);
  }, [days, habit]);

  const daysAmount = needToFillDays.length || 1;

  const progressPercent = days.reduce((acc, curr) => {
    const { percent } = getHabitDayProgress({ habit, date: curr });

    return acc + percent;
  }, 0);

  const autoFillCounter = useMemo(() => {
    if (
      habit.type !== HabitType.QuitNegative ||
      !(habit as INegativeHabit).isAutoFillEnabled ||
      !habit.startDate
    ) {
      return 0;
    }

    const startTime = new Date(habit.startDate).getTime();
    const todayISO = getDateISO(new Date());
    const todayTime = new Date(todayISO).getTime();
    const habitEndTime = habit.endDate
      ? new Date(habit.endDate).getTime()
      : null;
    const counterEndTime =
      habitEndTime !== null ? Math.min(habitEndTime, todayTime) : todayTime;

    if (counterEndTime < startTime) {
      return 0;
    }

    const diff = counterEndTime - startTime;

    return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
  }, [habit]);

  const swipeableRef = useRef<any>(null);

  const closeSwipeable = () => {
    swipeableRef.current?.close();
  };

  const translateX = useSharedValue(0);
  const scaleY = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { scaleY: scaleY.value }],
    opacity: opacity.value,
  }));

  const deleteHabitFromContext = async () => {
    if (deleteHabit) {
      await deleteHabit(habit.id);
    }
  };

  const startDeleteAnimation = () => {
    translateX.value = withTiming(-300, { duration: 300 });
    scaleY.value = withTiming(0, { duration: 300 });
    opacity.value = withTiming(0, { duration: 300 }, async (finished) => {
      if (finished) {
        runOnJS(deleteHabitFromContext)();
      }
    });
  };

  const handleDeleteHabit = () => {
    Alert.alert(
      t('habits:confirm.delete.title'),
      t('habits:confirm.delete.description'),
      [
        {
          text: t('habits:button.cancel'),
          style: 'cancel',
          onPress: closeSwipeable,
        },
        {
          text: t('habits:button.deleteHabit'),
          style: 'destructive',
          onPress: () => {
            closeSwipeable();
            startDeleteAnimation();
          },
        },
      ]
    );
  };

  const handleResetProgress = () => {
    Alert.alert(
      t('habits:confirm.reset.title'),
      t('habits:confirm.reset.description'),
      [
        {
          text: t('habits:button.cancel'),
          style: 'cancel',
          onPress: closeSwipeable,
        },
        {
          text: t('habits:button.resetHabit'),
          onPress: () => {
            closeSwipeable();
            resetHabitProgress?.(habit.id);
          },
        },
      ]
    );
  };

  const renderRightActions = () => (
    <TouchableOpacity
      onPress={handleDeleteHabit}
      activeOpacity={0.8}
      style={styles.deleteAction}
    >
      <CrossIcon width={28} height={28} stroke={COLORS.Background} />
    </TouchableOpacity>
  );

  const renderLeftActions = () => {
    if (!isAutoFillEnabled) {
      return null;
    }

    return (
      <TouchableOpacity
        onPress={handleResetProgress}
        activeOpacity={0.8}
        style={styles.refreshAction}
      >
        <ReverseIcon width={28} height={28} fill={COLORS.Background} />
      </TouchableOpacity>
    );
  };

  return (
    <GestureHandlerRootView>
      <ReanimatedSwipeable
        ref={swipeableRef}
        renderLeftActions={renderLeftActions}
        renderRightActions={renderRightActions}
      >
        <Animated.View
          style={[
            styles.habit,
            { backgroundColor: habit.color },
            animatedStyle,
          ]}
          key={habit.id}
        >
          <View style={styles.habitInfo}>
            <View style={styles.iconWrapper}>
              {habit.emoji ? (
                <Text style={styles.emoji}>{habit.emoji}</Text>
              ) : (
                <Text category={TEXT_TAGS.h1} style={styles.text}>
                  {habit.title.at(0)?.toUpperCase() ?? ''}
                </Text>
              )}
            </View>
            <View style={styles.titleBlock}>
              {isAutoFillEnabled && autoFillCounter > 0 && (
                <Text category={TEXT_TAGS.label} style={styles.counterText}>
                  {t('habits:label.autoFillCounter', {
                    count: autoFillCounter,
                  })}
                </Text>
              )}
              <Text category={TEXT_TAGS.h4} weight={TEXT_WEIGHT.medium}>
                {`${habit.title}${
                  habit.type === HabitType.BuildPositive &&
                  habit.goals[0].amount &&
                  habit.goals[0].unit
                    ? ` (${habit.goals[0].amount} ${habit.goals[0].unit})`
                    : ''
                }`}
              </Text>
              {!isAutoFillEnabled && (
                <ProgressBar
                  style={styles.bar}
                  progress={progressPercent / daysAmount}
                />
              )}
            </View>
            {!isAutoFillEnabled && (
              <Text
                style={styles.percentText}
                weight={TEXT_WEIGHT.bold}
                category={TEXT_TAGS.h4}
              >{`${((progressPercent / daysAmount) * 100).toFixed(0)}%`}</Text>
            )}
          </View>

          {habit.bestStreak > 0 && (
            <View style={styles.bestStreakWrapper}>
              <Text category={TEXT_TAGS.label} style={styles.bestStreakText}>
                {t('habits:label.bestStreak', { count: habit.bestStreak })}
              </Text>
            </View>
          )}

          <View style={styles.separator}></View>
          {!isAutoFillEnabled && (
            <View style={styles.days}>
              {days.map((day, index) => {
                const needToFill = needToFillDays.includes(index);

                const dayProgress = getHabitDayProgress({ habit, date: day });

                return (
                  <View
                    key={`${habit.id}-${getDateISO(day)}`}
                    style={styles.dateWrapper}
                  >
                    {!!weekDays[index] && <Text>{weekDays[index].day}</Text>}
                    <View style={needToFill ? styles.needToFill : null}>
                      <TouchableOpacity
                        disabled={!needToFill || isAutoFillEnabled}
                        activeOpacity={0.7}
                        style={[
                          styles.day,
                          dayProgress.isCompleted ? null : styles.unfilled,
                        ]}
                        onPress={
                          !isAutoFillEnabled
                            ? async () =>
                                await fillInSimpleHabit?.({
                                  id: habit.id,
                                  date: getDateISO(day),
                                })
                            : () => {}
                        }
                      >
                        <Checked stroke={habit.color} width={24} height={24} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </Animated.View>
      </ReanimatedSwipeable>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  habit: {
    borderRadius: 12,
    padding: 8,
    gap: 12,
  },
  habitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconWrapper: {
    backgroundColor: COLORS.Content,
    borderRadius: 8,
    height: 48,
    width: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 32,
  },
  bar: {
    height: 10,
    borderRadius: 10,
  },
  text: {
    color: COLORS.Background2,
  },
  titleBlock: {
    flex: 1,
    justifyContent: 'space-between',
    gap: 12,
  },
  percentText: {
    color: COLORS.Background,
    paddingVertical: 4,
    paddingHorizontal: 2,
    backgroundColor: COLORS.Content,
    width: 52,
    borderRadius: 16,
    textAlign: 'center',
  },
  counterText: {
    color: COLORS.Background,
    backgroundColor: COLORS.Content,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-end',
  },
  separator: {
    width: '100%',
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: COLORS.SpbSky1opacity30,
  },
  bestStreakText: {
    color: COLORS.Background,
    backgroundColor: COLORS.Content50,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bestStreakWrapper: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 8,
  },
  days: {
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
  },
  day: {
    width: 28,
    height: 28,
    borderRadius: 28,
    backgroundColor: COLORS.Content,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unfilled: {
    opacity: 0.3,
  },
  needToFill: {
    borderRadius: 28,
    width: 30,
    height: 30,
    borderWidth: 1,
    borderColor: COLORS.Content,
  },
  dateWrapper: {
    alignItems: 'center',
    gap: 4,
  },
  deleteAction: {
    backgroundColor: COLORS.Fury,
    justifyContent: 'center',
    alignItems: 'center',
    width: 88,
    borderRadius: 12,
    marginVertical: 0,
    marginLeft: 16,
  },
  refreshAction: {
    backgroundColor: COLORS.Info600,
    justifyContent: 'center',
    alignItems: 'center',
    width: 88,
    borderRadius: 12,
    marginVertical: 0,
    marginRight: 16,
  },
});

export default HabitWeekCard;
