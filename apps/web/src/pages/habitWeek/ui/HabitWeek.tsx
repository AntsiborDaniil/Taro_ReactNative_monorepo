import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { HabitsContext } from 'entities/habits';
import { useTranslation } from 'react-i18next';
import { HabitWeekCard } from 'features/habits';
import { Header } from 'features/header';
import { useData } from 'shared/DataProvider';
import { useNativeNavigation } from 'shared/hooks';
import { TarotDeck } from 'shared/icons';
import {
  getCurrentWeekBounds,
  getDateISO,
  getHabitDayProgress,
} from 'shared/lib';
import { AsyncMemoryKey } from 'shared/lib/deviceMemory/keys';
import { getValueForAsyncDeviceMemoryKey } from 'shared/lib/deviceMemory/workWithAsyncMemoryKeys';
import { COLORS } from 'shared/themes';
import { HabitType, NavigationRoute, TabRoute, THabit } from 'shared/types';
import { NoContent, ScreenLayout, Text, TEXT_TAGS } from 'shared/ui';

// потом убрать обертку страницы и вставить на одну, где день

function HabitWeek() {
  const { t } = useTranslation();

  const { habitsOfTheWeek } = useData({
    Context: HabitsContext,
  });

  const navigation = useNativeNavigation();
  const [rewardWeek, setRewardWeek] = useState<string | null | undefined>(
    undefined
  );

  const weekBounds = useMemo(() => getCurrentWeekBounds(), []);
  const weekStartISO = useMemo(
    () => getDateISO(weekBounds.start),
    [weekBounds.start]
  );

  const allHabitsCompleted = useMemo(() => {
    if (!habitsOfTheWeek?.length) {
      return false;
    }

    return habitsOfTheWeek.every((habit) =>
      isHabitCompletedForWeek(habit, weekBounds.days)
    );
  }, [habitsOfTheWeek, weekBounds.days]);

  const showGoalScreen =
    typeof rewardWeek !== 'undefined' &&
    allHabitsCompleted &&
    rewardWeek !== weekStartISO;

  useEffect(() => {
    let isMounted = true;

    const loadRewardWeek = async () => {
      const storedWeek = await getValueForAsyncDeviceMemoryKey<string | null>(
        AsyncMemoryKey.GoalCelebrationWeek
      );

      if (isMounted) {
        setRewardWeek(storedWeek ?? null);
      }
    };

    void loadRewardWeek();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    const maybeShowCelebration = async () => {
      if (!showGoalScreen) {
        return;
      }

      if (isActive) {
        navigation.navigate(TabRoute.MainTab, {
          screen: NavigationRoute.GoalCelebration,
        });
      }
    };

    void maybeShowCelebration();

    return () => {
      isActive = false;
    };
  }, [showGoalScreen, navigation]);

  const shouldShowRewardBanner =
    !!habitsOfTheWeek?.length && rewardWeek !== weekStartISO;

  return (
    <ScreenLayout>
      <Header showBackButton title={t('habits:title.progress')} />
      <ScrollView style={styles.wrapper}>
        <View style={styles.progress}>
          {habitsOfTheWeek?.length ? (
            <>
              {shouldShowRewardBanner && (
                <TouchableOpacity
                  activeOpacity={showGoalScreen ? 0.7 : 1}
                  onPress={
                    showGoalScreen
                      ? () =>
                          navigation.navigate(TabRoute.MainTab, {
                            screen: NavigationRoute.GoalCelebration,
                          })
                      : undefined
                  }
                >
                  <View style={styles.banner}>
                    <View style={styles.bannerIcon}>
                      <TarotDeck width={28} height={28} />
                    </View>
                    <View style={styles.bannerContent}>
                      <Text category={TEXT_TAGS.h4} style={styles.bannerTitle}>
                        {t('habits:banner.rewardTitle')}
                      </Text>
                      <Text
                        category={TEXT_TAGS.label}
                        style={styles.bannerText}
                      >
                        {t('habits:banner.rewardDescription')}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
              {habitsOfTheWeek.map((habit) => (
                <HabitWeekCard key={habit.id} habit={habit} />
              ))}
            </>
          ) : (
            <NoContent
              title={t('habits:title.empty')}
              buttonText={t('habits:button.empty')}
              onPress={() =>
                navigation.navigate(TabRoute.MainTab, {
                  screen: NavigationRoute.HabitCreate,
                })
              }
            />
          )}
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 64,
  },
  progress: {
    gap: 16,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: COLORS.Background2,
  },
  bannerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.Background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerContent: {
    flex: 1,
    gap: 4,
  },
  bannerTitle: {
    color: COLORS.Content,
  },
  bannerText: {
    color: COLORS.SpbSky1,
  },
});

export default HabitWeek;

function isHabitCompletedForWeek(habit: THabit, days: Date[]): boolean {
  if (!habit.startDate) {
    return false;
  }

  const needToFillDays = days.reduce<number[]>((acc, day, index) => {
    const isNeed =
      ((habit.type === HabitType.BuildPositive &&
        habit.frequencyDays?.includes(index)) ||
        (habit.type === HabitType.QuitNegative && !habit.isAutoFillEnabled)) &&
      habit.startDate &&
      day.getTime() >= new Date(habit.startDate).getTime();

    if (!isNeed) {
      return acc;
    }

    return [...acc, index];
  }, []);

  const daysAmount = needToFillDays.length || 1;

  if (!daysAmount) {
    return false;
  }

  const progressPercent = days.reduce((acc, currentDay) => {
    const { percent } = getHabitDayProgress({ habit, date: currentDay });

    return acc + percent;
  }, 0);

  return progressPercent / daysAmount >= 1;
}
