import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Spreads } from 'pages/spreads';
import { NavigationRoute } from 'shared/types';
import { darkStackScreenOptions } from '../stackScreenOptions';
import {
  LazyDetailCard,
  LazySpreadDescriptionChoice,
  LazySpreadReadings,
} from '../lazyScreens';

const SpreadsStack = createNativeStackNavigator();

function SpreadsScreen() {
  return (
    <SpreadsStack.Navigator
      initialRouteName={NavigationRoute.Spreads}
      screenOptions={darkStackScreenOptions}
    >
      <SpreadsStack.Screen name={NavigationRoute.Spreads} component={Spreads} />
      <SpreadsStack.Screen
        name={NavigationRoute.SpreadReadings}
        component={LazySpreadReadings}
      />
      <SpreadsStack.Screen
        name={NavigationRoute.SpreadDetailCard}
        component={LazyDetailCard}
      />
      <SpreadsStack.Screen
        name={NavigationRoute.SpreadDescriptionChoice}
        component={LazySpreadDescriptionChoice}
      />
    </SpreadsStack.Navigator>
  );
}

export default SpreadsScreen;
