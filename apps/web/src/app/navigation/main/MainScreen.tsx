import { useEffect } from 'react';
import { useNavigationState } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AffirmationsContext, useAffirmations } from 'entities/affirmations';
import { MoodAndEnergyContext, useMoodAndEnergy } from 'entities/moodAndEnergy';
import { Main } from 'pages/main';
import { TabsAndRoutesContext } from 'shared/contexts/TabsAndRoutes';
import { DataProvider, MultiProvider, useData } from 'shared/DataProvider';
import { ensureI18nNamespaces } from 'shared/lib/i18n/loadNamespaces';
import { NavigationRoute, TabRoute } from 'shared/types';
import { darkStackScreenOptions } from '../stackScreenOptions';
import {
  LazyAffirmations,
  LazyCardsDictionary,
  LazyDayAdvice,
  LazyDetailCard,
  LazyFavoriteCards,
  LazyGoalCelebration,
  LazyHabitChoose,
  LazyHabitCreate,
  LazyHabitWeek,
  LazyMoodAndEnergyScreen,
  LazyMotivationScreen,
  LazySpreadDescriptionChoice,
  LazySpreadReadings,
  LazySpreads,
  LazySpreadsHistory,
} from '../lazyScreens';

const MainStack = createNativeStackNavigator();

function MainScreen() {
  const affrmationsContextData = useAffirmations();

  const moodAndEnergyContextData = useMoodAndEnergy();

  const state = useNavigationState((navState) => navState);

  const { setSelectedTab } = useData({ Context: TabsAndRoutesContext });

  useEffect(() => {
    const currentTab = state.routes[state.index].name;

    setSelectedTab?.(currentTab as TabRoute);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  useEffect(() => {
    void ensureI18nNamespaces('affirmations');
  }, []);

  return (
    <MultiProvider
      providers={[
        <DataProvider
          Context={AffirmationsContext}
          value={affrmationsContextData}
          key="AffirmationsContext"
        />,
        <DataProvider
          Context={MoodAndEnergyContext}
          value={moodAndEnergyContextData}
          key="MoodAndEnergyContext"
        />,
      ]}
    >
      <MainStack.Navigator screenOptions={darkStackScreenOptions}>
        <MainStack.Screen name={NavigationRoute.Main} component={Main} />
        <MainStack.Screen
          name={NavigationRoute.MoodAndEnergy}
          component={LazyMoodAndEnergyScreen}
        />
        <MainStack.Screen
          name={NavigationRoute.DayAdvice}
          component={LazyDayAdvice}
        />
        <MainStack.Screen name={NavigationRoute.Spreads} component={LazySpreads} />
        <MainStack.Screen
          name={NavigationRoute.MotivationCard}
          component={LazyMotivationScreen}
        />
        <MainStack.Screen
          name={NavigationRoute.HabitCreate}
          component={LazyHabitCreate}
        />
        <MainStack.Screen
          name={NavigationRoute.HabitChoose}
          component={LazyHabitChoose}
        />
        <MainStack.Screen
          name={NavigationRoute.HabitsWeek}
          component={LazyHabitWeek}
        />
        <MainStack.Screen
          name={NavigationRoute.GoalCelebration}
          component={LazyGoalCelebration}
        />
        <MainStack.Screen
          name={NavigationRoute.SpreadsHistory}
          component={LazySpreadsHistory}
        />
        <MainStack.Screen
          name={NavigationRoute.Affirmations}
          component={LazyAffirmations}
        />
        <MainStack.Screen
          name={NavigationRoute.CardsDictionary}
          component={LazyCardsDictionary}
        />
        <MainStack.Screen
          name={NavigationRoute.FavoriteCards}
          component={LazyFavoriteCards}
        />
        <MainStack.Screen
          name={NavigationRoute.SpreadReadings}
          component={LazySpreadReadings}
        />
        <MainStack.Screen
          name={NavigationRoute.SpreadDescriptionChoice}
          component={LazySpreadDescriptionChoice}
        />
        <MainStack.Screen
          name={NavigationRoute.SpreadDetailCard}
          component={LazyDetailCard}
        />
      </MainStack.Navigator>
    </MultiProvider>
  );
}

export default MainScreen;
