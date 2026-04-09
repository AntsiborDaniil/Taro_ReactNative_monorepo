import { useEffect } from 'react';
import { useNavigationState } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AffirmationsContext, useAffirmations } from 'entities/affirmations';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { MoodAndEnergyContext, useMoodAndEnergy } from 'entities/moodAndEnergy';
import { SpreadContext, useSpread } from 'entities/Spread';
import { Affirmations } from 'pages/affirmations';
import { CardsDictionary } from 'pages/cardsDictionary';
import { DayAdvice } from 'pages/dayAdvice';
import { DetailCard } from 'pages/detailCard';
import { FavoriteCards } from 'pages/favoriteCards';
import { HabitChoose } from 'pages/habitChoose';
import { HabitCreate } from 'pages/habitCreate';
import { HabitWeek } from 'pages/habitWeek';
import { GoalCelebration } from 'pages/goalCelebration';
import { Main } from 'pages/main';
import { MoodAndEnergyScreen } from 'pages/moodAndEnergy';
import { MotivationScreen } from 'pages/motivation';
import { SpreadDescriptionChoice } from 'pages/spreadDescriptionChoice';
import { SpreadReadings } from 'pages/spreadReadings';
import { Spreads } from 'pages/spreads';
import { SpreadsHistory } from 'pages/spreadsHistory';
import { TabsAndRoutesContext } from 'shared/contexts/TabsAndRoutes';
import { DataProvider, MultiProvider, useData } from 'shared/DataProvider';
import { NavigationRoute, TabRoute } from 'shared/types';

const MainStack = createNativeStackNavigator();

function MainScreen() {
  const { spread } = useData({ Context: ApplicationConfigContext });

  const spreadContextData = useSpread({
    hasReversedCards: spread?.hasReversed,
  });

  const affrmationsContextData = useAffirmations();

  const moodAndEnergyContextData = useMoodAndEnergy();

  const state = useNavigationState((state) => state);

  const { setSelectedTab } = useData({ Context: TabsAndRoutesContext });

  useEffect(() => {
    const currentTab = state.routes[state.index].name;

    setSelectedTab?.(currentTab as TabRoute);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <MultiProvider
      providers={[
        <DataProvider
          Context={SpreadContext}
          value={spreadContextData}
          key="ApplicationConfigContext"
        />,
        <DataProvider
          Context={AffirmationsContext}
          value={affrmationsContextData}
          key="AffirmationsContext"
        />,
        <DataProvider
          Context={MoodAndEnergyContext}
          value={moodAndEnergyContextData}
          key="AffirmationsContext"
        />,
      ]}
    >
      <MainStack.Navigator screenOptions={{ headerShown: false }}>
        <MainStack.Screen name={NavigationRoute.Main} component={Main} />
        <MainStack.Screen
          name={NavigationRoute.MoodAndEnergy}
          component={MoodAndEnergyScreen}
        />
        <MainStack.Screen
          name={NavigationRoute.DayAdvice}
          component={DayAdvice}
        />
        <MainStack.Screen name={NavigationRoute.Spreads} component={Spreads} />
        <MainStack.Screen
          name={NavigationRoute.MotivationCard}
          component={MotivationScreen}
        />
        <MainStack.Screen
          name={NavigationRoute.HabitCreate}
          component={HabitCreate}
        />
        <MainStack.Screen
          name={NavigationRoute.HabitChoose}
          component={HabitChoose}
        />
        <MainStack.Screen
          name={NavigationRoute.HabitsWeek}
          component={HabitWeek}
        />
        <MainStack.Screen
          name={NavigationRoute.GoalCelebration}
          component={GoalCelebration}
        />
        <MainStack.Screen
          name={NavigationRoute.SpreadsHistory}
          component={SpreadsHistory}
        />
        <MainStack.Screen
          name={NavigationRoute.Affirmations}
          component={Affirmations}
        />
        <MainStack.Screen
          name={NavigationRoute.CardsDictionary}
          component={CardsDictionary}
        />
        <MainStack.Screen
          name={NavigationRoute.FavoriteCards}
          component={FavoriteCards}
        />
        <MainStack.Screen
          name={NavigationRoute.SpreadReadings}
          component={SpreadReadings}
        />
        <MainStack.Screen
          name={NavigationRoute.SpreadDescriptionChoice}
          component={SpreadDescriptionChoice}
        />
        <MainStack.Screen
          name={NavigationRoute.SpreadDetailCard}
          component={DetailCard}
        />
      </MainStack.Navigator>
    </MultiProvider>
  );
}

export default MainScreen;
