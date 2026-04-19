import { useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, useWindowDimensions } from 'react-native';
import AppMetrica from '@appmetrica/react-native-analytics';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CommonActions } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { TabsAndRoutesContext } from 'shared/contexts/TabsAndRoutes';
import { useData } from 'shared/DataProvider';
import { BookIcon, CardsIcon, PlanetIcon } from 'shared/icons';
import { blurActiveElement } from 'shared/lib';
import { COLORS } from 'shared/themes';
import { AnalyticAction, TabRoute } from 'shared/types';
import { TarotToast } from 'shared/ui';
import LibraryScreen from '../library/LibraryScreen';
import MainScreen from '../main/MainScreen';
import SpreadsScreen from '../spreads/SpreadsScreen';
import { AdaptiveTabBar } from './AdaptiveTabBar';
import {
  getAdaptiveTabVariant,
  readTabRailCollapsedFromSession,
  TAB_RAIL_COLLAPSED_SESSION_KEY,
  TAB_RAIL_WIDTH_COLLAPSED,
  TAB_RAIL_WIDTH_EXPANDED,
} from './adaptiveTabLayout';
import { TabRailLayoutProvider } from './TabRailLayoutContext';

const TAB_ICON = {
  [TabRoute.MainTab]: PlanetIcon,
  [TabRoute.SpreadsTab]: CardsIcon,
  [TabRoute.LibraryTab]: BookIcon,
};

const Tabs = createBottomTabNavigator();

function TarotTabs() {
  const { t } = useTranslation('core');
  const { width } = useWindowDimensions();
  const variant = getAdaptiveTabVariant(width);
  const isRail = variant === 'rail';
  const isLabeled = variant === 'labeled';

  const [railCollapsed, setRailCollapsed] = useState(() =>
    readTabRailCollapsedFromSession()
  );

  useEffect(() => {
    if (Platform.OS !== 'web' || !isRail) {
      return;
    }

    try {
      window.sessionStorage.setItem(
        TAB_RAIL_COLLAPSED_SESSION_KEY,
        railCollapsed ? '1' : '0'
      );
    } catch {
      /* ignore quota / private mode */
    }
  }, [isRail, railCollapsed]);

  const effectiveRailWidth = isRail
    ? railCollapsed
      ? TAB_RAIL_WIDTH_COLLAPSED
      : TAB_RAIL_WIDTH_EXPANDED
    : 0;

  const railLayoutValue = useMemo(
    () => ({
      effectiveRailWidth,
      isCollapsed: railCollapsed,
      toggleCollapsed: () => setRailCollapsed((c) => !c),
    }),
    [effectiveRailWidth, railCollapsed]
  );

  const { selectedTab } = useData({ Context: TabsAndRoutesContext });

  const { handleVibrationClick } = useData({
    Context: ApplicationConfigContext,
  });

  const iconSize = isLabeled ? 36 : 40;

  return (
    <TabRailLayoutProvider value={railLayoutValue}>
      <Tabs.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarPosition: isRail ? 'left' : 'bottom',
          tabBarShowLabel: isLabeled,
          tabBarLabelPosition: 'below-icon',
          tabBarActiveTintColor: COLORS.Primary,
          tabBarInactiveTintColor: COLORS.Content,
          tabBarLabelStyle: isLabeled
            ? {
                fontFamily: 'Montserrat-Medium',
                fontSize: 22,
                letterSpacing: 0.2,
                marginTop: 2,
              }
            : undefined,
          tabBarItemStyle: isLabeled
            ? { paddingTop: 6, paddingBottom: 2 }
            : { paddingTop: 4 },
          tabBarIconStyle: isLabeled ? { marginTop: 8 } : { marginTop: 12 },
          tabBarStyle: isRail
            ? {
                width: effectiveRailWidth,
                borderTopWidth: 0,
                borderWidth: 0,
                backgroundColor: COLORS.Background2,
                elevation: 0,
                shadowOpacity: 0,
                ...(Platform.OS === 'web'
                  ? ({
                      transition: 'width 0.22s ease',
                      minWidth: effectiveRailWidth,
                    } as object)
                  : {}),
              }
            : {
                borderTopWidth: 0,
                ...styles.tabBar,
              },
          tabBarIcon: ({ color }) => {
            const Icon = TAB_ICON[route.name as TabRoute];
            return <Icon width={iconSize} height={iconSize} fill={color} />;
          },
        })}
        tabBar={(props) => (
          <AdaptiveTabBar
            {...props}
            variant={variant}
            railWidth={effectiveRailWidth}
            railCollapsed={railCollapsed}
            onToggleRailCollapsed={
              isRail
                ? () => {
                    blurActiveElement();
                    setRailCollapsed((c) => !c);
                  }
                : undefined
            }
            collapseLabel={t('nav.rail.collapse')}
            expandLabel={t('nav.rail.expand')}
          />
        )}
        screenListeners={({ navigation }) => ({
          tabPress: async (e) => {
            blurActiveElement();
            await handleVibrationClick?.();

            const tabName = e.target?.split('-')[0];
            if (tabName === selectedTab) {
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: tabName as TabRoute }],
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
        <Tabs.Screen
          name={TabRoute.MainTab}
          component={MainScreen}
          options={{ title: t('nav.tab.main') }}
        />
        <Tabs.Screen
          name={TabRoute.SpreadsTab}
          component={SpreadsScreen}
          options={{ title: t('nav.tab.spreads') }}
        />
        <Tabs.Screen
          name={TabRoute.LibraryTab}
          component={LibraryScreen}
          options={{ title: t('nav.tab.library') }}
        />
      </Tabs.Navigator>
      <TarotToast />
    </TabRailLayoutProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderColor: COLORS.Background2,
    borderWidth: 0,
    backgroundColor: COLORS.Background2,
  },
});

export default TarotTabs;
