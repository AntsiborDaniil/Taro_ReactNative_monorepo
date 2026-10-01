import {
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { HabitsContext } from 'entities/habits';
import { useTranslation } from 'react-i18next';
import { useData } from 'shared/DataProvider';
import { useNativeNavigation } from 'shared/hooks';
import { getCurrentDate, getHabitDayProgress, WEB_HOVER_TRANSITION } from 'shared/lib';
import { NavigationRoute, TabRoute } from 'shared/types';
import { Text, TEXT_TAGS, TEXT_WEIGHT } from 'shared/ui';
import { DS_COLORS, dsWebTransition } from 'shared/themes/ds';

function HabitWidget() {
  const date = getCurrentDate();
  const { width: winW } = useWindowDimensions();
  const plusSize = Math.round(Math.min(72, Math.max(52, winW * 0.14)));
  const plusRadius = Math.round(plusSize * 0.32);
  const plusFont = Math.round(plusSize * 0.42);

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
    <Pressable
      accessibilityRole="button"
      onPress={async () => {
        await handleVibrationClick?.();

        navigation.navigate(TabRoute.MainTab, {
          screen: NavigationRoute.HabitsWeek,
        });
      }}
      style={(state) => [
        styles.rootPressable,
        (state as { hovered?: boolean }).hovered && styles.rootHovered,
        state.pressed && styles.rootPressed,
      ]}
    >
      <View style={styles.container}>
        <View style={styles.topRow}>
          <View style={styles.main}>
            <View style={styles.headerRow}>
              <Text
                category={TEXT_TAGS.label}
                weight={TEXT_WEIGHT.medium}
                style={styles.dateText}
              >
                {`${date.charAt(0).toUpperCase()}${date.slice(1).toLowerCase()}`}
              </Text>
              <Text style={styles.percent} category={TEXT_TAGS.h4} weight={TEXT_WEIGHT.medium}>
                {`${(progressPercent * 100).toFixed(0)}%`}
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.round(Math.min(1, Math.max(0, progressPercent)) * 100)}%` },
                ]}
              />
            </View>
            {habitsOfTheDay?.length ? (
              <Text style={styles.goalsText} category={TEXT_TAGS.p1}>
                {t('habits:widget.completedGoals', {
                  completed: completedGoals,
                  total: habitsOfTheDay.length,
                })}
              </Text>
            ) : (
              <Text style={styles.goalsText} category={TEXT_TAGS.p1}>
                {t('habits:widget.empty')}
              </Text>
            )}
          </View>
          <Pressable
            style={[
              styles.image,
              {
                width: plusSize,
                height: plusSize,
                borderRadius: plusRadius,
                marginLeft: winW < 400 ? 10 : 14,
              },
            ]}
            onPress={async (e) => {
              e.stopPropagation();

              await handleVibrationClick?.();

              navigation.navigate(TabRoute.MainTab, {
                screen: NavigationRoute.HabitChoose,
              });
            }}
          >
            <Text
              weight={TEXT_WEIGHT.bold}
              style={[styles.plus, { fontSize: plusFont, lineHeight: plusFont }]}
            >
              +
            </Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  rootPressable: {
    borderRadius: 16,
    ...({ cursor: 'pointer', ...WEB_HOVER_TRANSITION } as object),
    ...dsWebTransition,
  },
  rootHovered: {
    borderColor: DS_COLORS.accent400,
  },
  rootPressed: {
    opacity: 0.95,
  },
  container: {
    borderWidth: 1,
    borderRadius: 18,
    borderColor: DS_COLORS.ground600,
    backgroundColor: DS_COLORS.ground700,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
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
    textAlign: 'center',
    color: DS_COLORS.ink50,
  },
  image: {
    backgroundColor: DS_COLORS.ground600,
    borderWidth: 1,
    borderColor: DS_COLORS.accent400,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  dateText: {
    color: DS_COLORS.ink100,
  },
  goalsText: {
    width: '100%',
    textAlign: 'center',
    color: DS_COLORS.ink100,
    paddingHorizontal: 4,
    marginTop: 8,
  },
  percent: {
    backgroundColor: DS_COLORS.calm600,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DS_COLORS.calm500,
    color: DS_COLORS.ink50,
    overflow: 'hidden',
  },
  main: {
    justifyContent: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  progressTrack: {
    height: 12,
    borderRadius: 16,
    backgroundColor: DS_COLORS.ground600,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: {
    height: '100%',
    borderRadius: 16,
    backgroundColor: DS_COLORS.calm500,
  },
});

export default HabitWidget;
