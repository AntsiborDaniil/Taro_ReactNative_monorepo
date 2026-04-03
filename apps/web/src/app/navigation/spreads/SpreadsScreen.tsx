import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { SpreadContext, useSpread } from 'entities/Spread';
import { DetailCard } from 'pages/detailCard';
import { SpreadDescriptionChoice } from 'pages/spreadDescriptionChoice';
import { SpreadReadings } from 'pages/spreadReadings';
import { Spreads } from 'pages/spreads';
import { DataProvider, MultiProvider, useData } from 'shared/DataProvider';
import { NavigationRoute } from 'shared/types';

const SpreadsStack = createNativeStackNavigator();

function SpreadsScreen() {
  const { spread } = useData({ Context: ApplicationConfigContext });

  const spreadContextData = useSpread({
    hasReversedCards: spread?.hasReversed,
  });

  return (
      <MultiProvider
        providers={[
          <DataProvider
            Context={SpreadContext}
            value={spreadContextData}
            key="SpreadContext"
          />,
        ]}
      >
      <SpreadsStack.Navigator
        initialRouteName={NavigationRoute.Spreads}
        screenOptions={{ headerShown: false }}
      >
        {/*<SpreadsStack.Screen*/}
        {/*  name={NavigationRoute.SpreadsGroups}*/}
        {/*  component={SpreadsGroups}*/}
        {/*/>*/}
        <SpreadsStack.Screen
          name={NavigationRoute.Spreads}
          component={Spreads}
        />
        <SpreadsStack.Screen
          name={NavigationRoute.SpreadReadings}
          component={SpreadReadings}
        />
        <SpreadsStack.Screen
          name={NavigationRoute.SpreadDetailCard}
          component={DetailCard}
        />
        <SpreadsStack.Screen
          name={NavigationRoute.SpreadDescriptionChoice}
          component={SpreadDescriptionChoice}
        />
      </SpreadsStack.Navigator>
    </MultiProvider>
  );
}

export default SpreadsScreen;
