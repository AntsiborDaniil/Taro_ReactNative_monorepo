import { Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ProgressBar } from '@ui-kitten/components';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { HabitsContext } from 'entities/habits';
import { useTranslation } from 'react-i18next';
import { useData } from 'shared/DataProvider';
import { useNativeNavigation } from 'shared/hooks';
import { getCurrentDate, getHabitDayProgress } from 'shared/lib';
import { COLORS } from 'shared/themes';
import { NavigationRoute, TabRoute } from 'shared/types';
import { Text, TEXT_TAGS, TEXT_WEIGHT } from 'shared/ui';

function HabitWidget() {
  const date = getCurrentDate();

  const navigation = useNativeNavigation();

  const { handleVibrationClick } = useData({
    Context: ApplicationConfigContext,
  });

  const { habitsOfTheDay } = useData({ Context: HabitsContext });

  const { t } = useTranslation();

  const today = new Date();

  const progressPercent = habitsOfTheDay?.length
    ? habitsOfTheDay.reduce((acc: number, curr) => {
        const { percent } = getHabitDayProgress({ habit: curr, date: today });

        return acc + percent;
      }, 0) / habitsOfTheDay.length
    : 0;

  const completedGoals =
    habitsOfTheDay?.reduce((acc, curr) => {
      const { isCompleted } = getHabitDayProgress({ habit: curr, date: today });

      return acc + (isCompleted ? 1 : 0);
    }, 0) ?? 0;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={async () => {
        await handleVibrationClick?.();

        navigation.navigate(TabRoute.MainTab, {
          screen: NavigationRoute.HabitsWeek,
        });
      }}
    >
      <View style={styles.container}>
        <View style={styles.topRow}>
          <View style={styles.main}>
            <View style={styles.headerRow}>
              <Text category={TEXT_TAGS.h4} weight={TEXT_WEIGHT.medium}>
                {`${date[0].toUpperCase()}${date.slice(1)}`}
              </Text>
              <Text
                style={styles.percent}
                category={TEXT_TAGS.h4}
                weight={TEXT_WEIGHT.medium}
              >
                {`${(progressPercent * 100).toFixed(0)}%`}
              </Text>
            </View>
            <ProgressBar style={styles.progress} progress={progressPercent} />
            {habitsOfTheDay?.length ? (
              <Text style={styles.description} category={TEXT_TAGS.label}>
                {t('habits:widget.completedGoals', {
                  completed: completedGoals,
                  total: habitsOfTheDay.length,
                })}
              </Text>
            ) : (
              <Text style={styles.description} category={TEXT_TAGS.label}>
                {t('habits:widget.empty')}
              </Text>
            )}
          </View>
          <Pressable
            style={styles.image}
            onPress={async (e) => {
              e.stopPropagation();

              await handleVibrationClick?.();

              navigation.navigate(TabRoute.MainTab, {
                screen: NavigationRoute.HabitChoose,
              });
            }}
          >
            <Text style={styles.plus}>+</Text>
          </Pressable>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 2,
    borderRadius: 16,
    borderColor: COLORS.Primary600,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  plus: {
    fontSize: 32,
    lineHeight: 32,
    fontWeight: 700,
    textAlign: 'center',
    color: COLORS.Content,
  },
  image: {
    width: 82,
    height: 82,
    backgroundColor: COLORS.Background2,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: COLORS.Primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    padding: 20,
    marginLeft: 18,
  },
  description: {
    width: '100%',
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 16,
    paddingHorizontal: 4,
    marginTop: 10,
  },
  percent: {
    backgroundColor: COLORS.Success700,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  main: {
    justifyContent: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  progress: {
    height: 12,
    borderRadius: 16,
  },
});

export default HabitWidget;
