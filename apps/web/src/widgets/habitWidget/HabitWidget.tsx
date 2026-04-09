import { StyleSheet, TouchableOpacity, View } from 'react-native';
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
        <View style={[styles.row, { justifyContent: 'flex-start' }]}>
          <View style={styles.main}>
            <View style={styles.row}>
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
          <TouchableOpacity
            activeOpacity={0.7}
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
          </TouchableOpacity>
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
    padding: 8,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  plus: {
    fontSize: 48,
    lineHeight: 43,
    textAlign: 'center',
  },
  image: {
    width: 52,
    height: 52,
    backgroundColor: COLORS.SpbSky3,
    borderRadius: '100%',
    padding: 12,
    alignItems: 'center',
  },
  description: { width: '100%', textAlign: 'center' },
  percent: {
    backgroundColor: COLORS.Success700,
    padding: 4,
    paddingHorizontal: 8,
    borderRadius: 16,
  },
  main: {
    justifyContent: 'space-between',
    height: 80,
    flex: 1,
  },
  progress: {
    height: 12,
    borderRadius: 16,
  },
});

export default HabitWidget;
