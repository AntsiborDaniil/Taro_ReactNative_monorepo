import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DetailCard } from 'pages/detailCard';
import { SpreadDescriptionChoice } from 'pages/spreadDescriptionChoice';
import { SpreadReadings } from 'pages/spreadReadings';
import { Spreads } from 'pages/spreads';
import { NavigationRoute } from 'shared/types';

const SpreadsStack = createNativeStackNavigator();

function SpreadsScreen() {
  return (
    <SpreadsStack.Navigator
      initialRouteName={NavigationRoute.Spreads}
      screenOptions={{ headerShown: false }}
    >
      {/*<SpreadsStack.Screen*/}
      {/*  name={NavigationRoute.SpreadsGroups}*/}
      {/*  component={SpreadsGroups}*/}
      {/*/>*/}
      <SpreadsStack.Screen name={NavigationRoute.Spreads} component={Spreads} />
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
  );
}

export default SpreadsScreen;
