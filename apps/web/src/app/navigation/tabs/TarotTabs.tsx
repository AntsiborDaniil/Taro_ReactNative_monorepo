import { Platform, StyleSheet } from 'react-native';
import AppMetrica from '@appmetrica/react-native-analytics';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CommonActions } from '@react-navigation/native';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { TabsAndRoutesContext } from 'shared/contexts/TabsAndRoutes';
import { useData } from 'shared/DataProvider';
import { BookIcon, CardsIcon, PlanetIcon } from 'shared/icons';
import { COLORS } from 'shared/themes';
import { AnalyticAction, TabRoute } from 'shared/types';
import { TarotToast } from 'shared/ui';
import LibraryScreen from '../library/LibraryScreen';
import MainScreen from '../main/MainScreen';
// import SpreadsScreen from '../spreads/SpreadsScreen';

const TAB_ICON = {
  [TabRoute.MainTab]: PlanetIcon,
  [TabRoute.SpreadsTab]: CardsIcon,
  [TabRoute.LibraryTab]: BookIcon,
};

const Tabs = createBottomTabNavigator();

function TarotTabs() {
  const { selectedTab } = useData({ Context: TabsAndRoutesContext });

  const { handleVibrationClick } = useData({
    Context: ApplicationConfigContext,
  });

  return (
    <>
      <Tabs.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: {
            bottom: 0,
            height: Platform.OS === 'ios' ? 80 : 60,
            ...styles.tabBar,
          },
          tabBarIconStyle: { ...styles.tabBarIcon },
          tabBarActiveTintColor: COLORS.Primary,
          tabBarInactiveTintColor: COLORS.Content,
          tabBarIcon: ({ color }) => {
            const Icon = TAB_ICON[route.name as TabRoute];

            return <Icon width={40} height={40} fill={color} />;
          },
        })}
        screenListeners={({ navigation }) => ({
          tabPress: async (e) => {
            await handleVibrationClick?.();

            const tabName = e.target?.split('-')[0];
            if (tabName === selectedTab) {
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: tabName as TabRoute }], // Указываете нужный экран
                })
              );
              return;
            }

            AppMetrica.reportEvent(AnalyticAction.ClickTab, {
              tabName,
            });
          },
        })}
      >
        <Tabs.Screen name={TabRoute.MainTab} component={MainScreen} />
        {/*<Tabs.Screen name={TabRoute.SpreadsTab} component={SpreadsScreen} />*/}
        <Tabs.Screen name={TabRoute.LibraryTab} component={LibraryScreen} />
      </Tabs.Navigator>
      <TarotToast />
    </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderColor: COLORS.Background2,
    borderWidth: 0,
    backgroundColor: COLORS.Background2,
    boxShadow: '0px -5px 14.8px 0px #00000040',
  },
  tabBarIcon: {
    marginTop: 12,
  },
});

export default TarotTabs;
