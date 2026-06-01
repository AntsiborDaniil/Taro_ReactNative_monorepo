import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationRoute } from 'shared/types';
import {
  LazyDetailCard,
  LazySpreadDescriptionChoice,
  LazySpreadReadings,
  LazySpreads,
} from '../lazyScreens';

const SpreadsStack = createNativeStackNavigator();

function SpreadsScreen() {
  return (
    <SpreadsStack.Navigator
      initialRouteName={NavigationRoute.Spreads}
      screenOptions={{ headerShown: false }}
    >
      <SpreadsStack.Screen name={NavigationRoute.Spreads} component={LazySpreads} />
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
