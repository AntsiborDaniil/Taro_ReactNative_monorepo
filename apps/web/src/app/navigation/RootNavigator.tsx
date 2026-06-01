import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { darkStackScreenOptions } from './stackScreenOptions';
import TarotTabs from './tabs/TarotTabs';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={darkStackScreenOptions}>
      <Stack.Screen name="TarotTabs" component={TarotTabs} />
      {/* Здесь можно добавить другие экраны, например модальные или дополнительные стеки */}
    </Stack.Navigator>
  );
}
