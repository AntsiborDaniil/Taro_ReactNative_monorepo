import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { HabitsContext } from 'entities/habits';
import { MotivationContext } from 'entities/tarotMotivation';
import { useTranslation } from 'react-i18next';
import { Header } from 'features/header';
import { MotivationKey } from 'shared/api';
import { useData } from 'shared/DataProvider';
import { useNativeNavigation } from 'shared/hooks';
import { Star } from 'shared/icons';
import {
  AsyncMemoryKey,
  getCurrentWeekBounds,
  getDateISO,
  saveAsyncDeviceMemoryKey,
} from 'shared/lib';
import { COLORS } from 'shared/themes';
import { HabitType, NavigationRoute, TabRoute } from 'shared/types';
import { Button, ScreenLayout, Text, TEXT_TAGS, TEXT_WEIGHT } from 'shared/ui';

function GoalCelebration() {
  const { t } = useTranslation();

  const navigation = useNativeNavigation();

  const { handleVibrationClick } = useData({
    Context: ApplicationConfigContext,
  });

  const { handleSelectMotivationItem } = useData({
    Context: MotivationContext,
  });

  const { habitsOfTheWeek } = useData({ Context: HabitsContext });

  const weekBounds = useMemo(() => getCurrentWeekBounds(), []);
  const weekStartISO = useMemo(
    () => getDateISO(weekBounds.start),
    [weekBounds.start]
  );

  const handleClaimReward = async () => {
    await handleVibrationClick?.();

    const goodHabits =
      habitsOfTheWeek
        ?.filter((habit) => habit.type === HabitType.BuildPositive)
        .map((habit) => habit.title) ?? [];
    const badHabits =
      habitsOfTheWeek
        ?.filter((habit) => habit.type === HabitType.QuitNegative)
        .map((habit) => habit.title) ?? [];

    await handleSelectMotivationItem?.({
      key: MotivationKey.Habits,
      parameters: {
        goodHabits,
        badHabits,
      },
    });

    await saveAsyncDeviceMemoryKey(
      AsyncMemoryKey.GoalCelebrationWeek,
      weekStartISO
    );

    navigation.navigate(TabRoute.MainTab, {
      screen: NavigationRoute.MotivationCard,
    });
  };

  return (
    <ScreenLayout>
      <Header showBackButton title={t('achievements:header')} />
      <View style={styles.wrapper}>
        <View style={styles.card}>
          <View style={styles.ribbon} />
          <View style={styles.iconWrapper}>
            <Star width={64} height={64} />
          </View>
          <Text
            category={TEXT_TAGS.h2}
            weight={TEXT_WEIGHT.bold}
            style={styles.title}
          >
            {t('achievements:title')}
          </Text>
          <Text category={TEXT_TAGS.label} style={styles.badge}>
            {t('achievements:badge')}
          </Text>
          <Text category={TEXT_TAGS.p1} style={styles.description}>
            {t('achievements:description')}
          </Text>
          <Button style={styles.button} onPress={handleClaimReward}>
            {t('achievements:cta')}
          </Button>
        </View>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 64,
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.Background2,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  ribbon: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 220,
    backgroundColor: COLORS.Primary200,
    opacity: 0.15,
    top: -40,
    right: -60,
  },
  iconWrapper: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: COLORS.Primary600,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: COLORS.Primary200,
    boxShadow: `0 12px 24px ${COLORS.Primary}80`,
  },
  title: {
    textAlign: 'center',
  },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.Primary200,
    color: COLORS.Background,
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    color: COLORS.SpbSky1,
  },
  button: {
    alignSelf: 'stretch',
    marginTop: 8,
  },
});

export default GoalCelebration;
