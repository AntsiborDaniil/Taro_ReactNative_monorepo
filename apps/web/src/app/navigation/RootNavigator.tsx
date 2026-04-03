import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TarotTabs from './tabs/TarotTabs';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TarotTabs" component={TarotTabs} />
      {/* Здесь можно добавить другие экраны, например модальные или дополнительные стеки */}
    </Stack.Navigator>
  );
}
