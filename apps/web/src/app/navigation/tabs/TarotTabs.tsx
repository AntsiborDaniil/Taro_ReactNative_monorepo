import React, { useRef } from 'react';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import AppMetrica from '@appmetrica/react-native-analytics';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CommonActions } from '@react-navigation/native';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { TabsAndRoutesContext } from 'shared/contexts/TabsAndRoutes';
import { useData } from 'shared/DataProvider';
import { BookIcon, CardsIcon, PlanetIcon } from 'shared/icons';
import { getBreakpoint } from 'shared/lib';
import { COLORS } from 'shared/themes';
import { AnalyticAction, TabRoute } from 'shared/types';
import { TarotToast } from 'shared/ui';
import LibraryScreen from '../library/LibraryScreen';
import MainScreen from '../main/MainScreen';
import SpreadsScreen from '../spreads/SpreadsScreen';
import { WebSidebarNav } from './WebSidebarNav';

const TAB_ICON = {
  [TabRoute.MainTab]: PlanetIcon,
  [TabRoute.SpreadsTab]: CardsIcon,
  [TabRoute.LibraryTab]: BookIcon,
};

const Tabs = createBottomTabNavigator();

const TAB_LABELS: Record<TabRoute, string> = {
  [TabRoute.MainTab]:    'core:tab.home',
  [TabRoute.SpreadsTab]: 'core:tab.spreads',
  [TabRoute.LibraryTab]: 'core:tab.library',
};

function TarotTabs() {
  const { selectedTab, setSelectedTab } = useData({ Context: TabsAndRoutesContext });
  const { handleVibrationClick } = useData({ Context: ApplicationConfigContext });
  const { t } = useTranslation();

  // Capture the tab navigator's navigation object so the sidebar can use it
  const tabNavRef = useRef<any>(null);

  const { width } = useWindowDimensions();
  const breakpoint = getBreakpoint(width);
  const isMobile = breakpoint === 'mobile';

  const handleSidebarNavigate = async (tab: TabRoute) => {
    await handleVibrationClick?.();
    setSelectedTab?.(tab);
    tabNavRef.current?.navigate(tab);
  };

  return (
    <View style={[styles.shell, !isMobile && styles.shellWide]}>
      {/* Sidebar for tablet/desktop */}
      {!isMobile && (
        <WebSidebarNav
          selectedTab={selectedTab ?? TabRoute.MainTab}
          onNavigate={handleSidebarNavigate}
          breakpoint={breakpoint}
        />
      )}

      {/* Tab navigator — bottom tabs hidden on tablet/desktop */}
      <View style={styles.content}>
        <Tabs.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarShowLabel: false,
            tabBarStyle: isMobile
              ? {
                  bottom: 0,
                  height: Platform.OS === 'ios' ? 80 : 64,
                  paddingBottom: 8,
                  ...styles.tabBar,
                }
              : { display: 'none' },
            tabBarIconStyle: isMobile ? styles.tabBarIcon : undefined,
            tabBarActiveTintColor: COLORS.Primary,
            tabBarInactiveTintColor: COLORS.Content,
            tabBarIcon: ({ color }) => {
              const Icon = TAB_ICON[route.name as TabRoute];
              const label = t(TAB_LABELS[route.name as TabRoute] ?? route.name);
              return (
                <Icon
                  width={40}
                  height={40}
                  fill={color}
                  // @ts-ignore – web-only aria label on the SVG
                  aria-label={label}
                  role="img"
                />
              );
            },
            tabBarAccessibilityLabel: t(TAB_LABELS[route.name as TabRoute] ?? route.name),
          })}
          screenListeners={({ navigation, route }) => {
            // Capture tab navigation on first call so sidebar can use it
            if (!tabNavRef.current) {
              tabNavRef.current = navigation;
            }
            return {
              tabPress: async () => {
                await handleVibrationClick?.();
                const tabName = route.name as TabRoute;
                if (tabName === selectedTab) {
                  navigation.dispatch(
                    CommonActions.reset({
                      index: 0,
                      routes: [{ name: tabName }],
                    })
                  );
                  return;
                }
                setSelectedTab?.(tabName);
                AppMetrica.reportEvent(AnalyticAction.ClickTab, { tabName });
              },
            };
          }}
        >
          <Tabs.Screen name={TabRoute.MainTab} component={MainScreen} />
          <Tabs.Screen name={TabRoute.SpreadsTab} component={SpreadsScreen} />
          <Tabs.Screen name={TabRoute.LibraryTab} component={LibraryScreen} />
        </Tabs.Navigator>
        <TarotToast />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
  },
  shellWide: {
    flexDirection: 'row',
  },
  content: {
    flex: 1,
    overflow: 'hidden',
  },
  tabBar: {
    borderColor: COLORS.Background2,
    borderWidth: 0,
    backgroundColor: COLORS.Background2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  tabBarIcon: {
    marginTop: 4,
  },
});

export default TarotTabs;
