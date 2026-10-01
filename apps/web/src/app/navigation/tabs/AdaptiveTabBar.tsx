import AppMetrica from '@appmetrica/react-native-analytics';
import { BottomTabBar, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { createResetTabToRootAction } from '../resetTabToRoot';
import { ReactElement, useCallback } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { TabsAndRoutesContext } from 'shared/contexts/TabsAndRoutes';
import { useData } from 'shared/DataProvider';
import {
  BookIcon,
  CardsIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlanetIcon,
  SettingsIcon,
} from 'shared/icons';
import { blurActiveElement, WEB_HOVER_TRANSITION } from 'shared/lib';
import {
  useWebViewportInsets,
  WEB_TAB_BAR_CONTENT_HEIGHT,
} from 'shared/lib/web/useWebViewportInsets';
import { COLORS } from 'shared/themes';
import { DS_COLORS } from 'shared/themes/ds';
import { AnalyticAction, NavigationRoute, TabRoute } from 'shared/types';
import {
  type AdaptiveTabVariant,
  isWebMobileFabNav,
  TAB_BREAKPOINT_RAIL,
  TAB_NAV_LABEL_FONT_PX,
} from './adaptiveTabLayout';
import { MobileFabTabBar } from './MobileFabTabBar';

const TAB_ICON = {
  [TabRoute.MainTab]: PlanetIcon,
  [TabRoute.SpreadsTab]: CardsIcon,
  [TabRoute.LibraryTab]: BookIcon,
} as const;

type AdaptiveTabBarProps = BottomTabBarProps & {
  variant: AdaptiveTabVariant;
  railWidth: number;
  railCollapsed?: boolean;
  onToggleRailCollapsed?: () => void;
  collapseLabel?: string;
  expandLabel?: string;
  settingsLabel?: string;
};

export function AdaptiveTabBar({
  variant,
  railWidth,
  railCollapsed = false,
  onToggleRailCollapsed,
  collapseLabel,
  expandLabel,
  settingsLabel,
  state,
  descriptors,
  navigation,
  insets,
}: AdaptiveTabBarProps): ReactElement {
  const { width } = useWindowDimensions();
  const safe = useSafeAreaInsets();
  const viewportInsets = useWebViewportInsets();
  const { selectedTab, setSelectedTab } = useData({ Context: TabsAndRoutesContext });
  const { handleVibrationClick } = useData({ Context: ApplicationConfigContext });

  const onRailPress = useCallback(
    async (routeName: TabRoute) => {
      blurActiveElement();
      await handleVibrationClick?.();
      if (routeName === selectedTab) {
        navigation.dispatch(createResetTabToRootAction(routeName));
        return;
      }
      AppMetrica.reportEvent(AnalyticAction.ClickTab, { tabName: routeName });
      navigation.navigate(routeName);
      setSelectedTab?.(routeName);
    },
    [handleVibrationClick, navigation, selectedTab, setSelectedTab]
  );

  const onSettingsPress = useCallback(async () => {
    blurActiveElement();
    await handleVibrationClick?.();
    AppMetrica.reportEvent(AnalyticAction.ClickSettings);
    setSelectedTab?.(TabRoute.LibraryTab);
    (navigation.navigate as (name: string, params?: object) => void)(
      TabRoute.LibraryTab,
      { screen: NavigationRoute.Settings }
    );
  }, [handleVibrationClick, navigation, setSelectedTab]);

  const settingsFocused = (() => {
    const activeTab = state.routes[state.index];
    if (activeTab?.name !== TabRoute.LibraryTab) {
      return false;
    }
    const nested = activeTab.state as
      | { routes?: Array<{ name: string }>; index?: number }
      | undefined;
    const routes = nested?.routes;
    if (!routes?.length) {
      return false;
    }
    return routes[nested?.index ?? routes.length - 1]?.name === NavigationRoute.Settings;
  })();

  if (isWebMobileFabNav(width)) {
    return <MobileFabTabBar state={state} descriptors={descriptors} navigation={navigation} insets={insets} />;
  }

  if (variant === 'rail' && width >= TAB_BREAKPOINT_RAIL) {
    return (
      <View
        style={[
          styles.rail,
          {
            width: railWidth,
            minWidth: railWidth,
            paddingTop: safe.top + 16,
            paddingBottom: safe.bottom + 16,
          },
        ]}
        accessibilityRole="tablist"
      >
        <View style={styles.railBrand}>
          <View
            style={railCollapsed ? styles.railBrandColCollapsed : styles.railBrandRow}
          >
            <View style={styles.railBrandDot} />
            {onToggleRailCollapsed ? (
              <Pressable
                onPress={() => {
                  blurActiveElement();
                  onToggleRailCollapsed();
                }}
                style={(state) => {
                  const hovered =
                    Platform.OS === 'web' &&
                    (state as { hovered?: boolean }).hovered;
                  return [
                    styles.railToggle,
                    hovered && styles.railToggleHover,
                    state.pressed && styles.railTogglePressed,
                  ];
                }}
                accessibilityRole="button"
                accessibilityLabel={
                  railCollapsed ? expandLabel ?? 'Expand' : collapseLabel ?? 'Collapse'
                }
                hitSlop={12}
              >
                {railCollapsed ? (
                  <ChevronRightIcon width={20} height={20} fill={COLORS.Content} />
                ) : (
                  <ChevronLeftIcon width={20} height={20} fill={COLORS.Content} />
                )}
              </Pressable>
            ) : null}
          </View>
        </View>
        {state.routes.map((route) => {
          const focused = route.key === state.routes[state.index].key;
          const options = descriptors[route.key].options;
          const label =
            typeof options.title === 'string' && options.title.length > 0
              ? options.title
              : route.name;
          const Icon = TAB_ICON[route.name as TabRoute];
          const activeColor = focused ? COLORS.Primary : COLORS.Content50;
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              onPress={() => onRailPress(route.name as TabRoute)}
              style={(state) => {
                const hovered =
                  Platform.OS === 'web' &&
                  (state as { hovered?: boolean }).hovered;
                return [
                  styles.railItem,
                  focused && styles.railItemActive,
                  hovered && !focused && styles.railItemHover,
                ];
              }}
            >
              <View
                style={
                  railCollapsed ? styles.railItemInnerCollapsed : styles.railItemInner
                }
              >
                {Icon ? (
                  <Icon width={26} height={26} fill={activeColor} />
                ) : null}
                {!railCollapsed ? (
                  <Text
                    style={[
                      styles.railLabel,
                      { color: focused ? COLORS.Content : COLORS.Content50 },
                    ]}
                    numberOfLines={2}
                  >
                    {label}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          );
        })}

        <View style={styles.railSpacer} />
        <View style={styles.railDivider} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={settingsLabel}
          accessibilityState={{ selected: settingsFocused }}
          onPress={onSettingsPress}
          style={(state) => {
            const hovered =
              Platform.OS === 'web' && (state as { hovered?: boolean }).hovered;
            return [
              styles.railItem,
              settingsFocused && styles.railItemActive,
              hovered && !settingsFocused && styles.railItemHover,
            ];
          }}
        >
          <View
            style={
              railCollapsed ? styles.railItemInnerCollapsed : styles.railItemInner
            }
          >
            <SettingsIcon
              width={24}
              height={24}
              fill={settingsFocused ? COLORS.Primary : COLORS.Content50}
            />
            {!railCollapsed ? (
              <Text
                style={[
                  styles.railLabel,
                  { color: settingsFocused ? COLORS.Content : COLORS.Content50 },
                ]}
                numberOfLines={1}
              >
                {settingsLabel}
              </Text>
            ) : null}
          </View>
        </Pressable>
      </View>
    );
  }

  const webBottomInset =
    Platform.OS === 'web'
      ? Math.max(viewportInsets.bottom, insets.bottom, safe.bottom)
      : 0;
  const barHeight =
    Platform.OS === 'ios'
      ? 80
      : Platform.OS === 'web'
        ? WEB_TAB_BAR_CONTENT_HEIGHT + 8
        : 60 + safe.bottom;

  const tabBarInsets =
    Platform.OS === 'web'
      ? {
          ...insets,
          bottom: webBottomInset,
        }
      : insets;

  return (
    <BottomTabBar
      state={state}
      descriptors={descriptors}
      navigation={navigation}
      insets={tabBarInsets}
      style={[
        styles.bottomBar,
        styles.bottomBarCompact,
        {
          height: barHeight,
          ...(Platform.OS === 'web'
            ? ({
                marginBottom: webBottomInset,
              } as object)
            : {}),
          paddingBottom:
            Platform.OS === 'web' ? 8 : Math.max(insets.bottom, 6),
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  /** Потоковая колонка слева при `tabBarPosition: 'left'` — не absolute, чтобы контент занимал оставшуюся ширину. */
  rail: {
    flexShrink: 0,
    alignSelf: 'stretch',
    backgroundColor: COLORS.Background2,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: DS_COLORS.ground600,
    ...(Platform.OS === 'web'
      ? ({ transition: 'width 0.22s ease, min-width 0.22s ease' } as object)
      : {}),
    justifyContent: 'flex-start',
    gap: 4,
  },
  railBrand: {
    paddingHorizontal: 12,
    paddingBottom: 16,
    marginBottom: 4,
  },
  railBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  railBrandColCollapsed: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
  },
  railBrandDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.Primary,
    opacity: 0.9,
  },
  railToggle: {
    padding: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    ...WEB_HOVER_TRANSITION,
  },
  railToggleHover: {
    backgroundColor: DS_COLORS.ground700,
  },
  railTogglePressed: {
    opacity: 0.85,
  },
  railItem: {
    marginHorizontal: 6,
    borderRadius: 14,
    overflow: 'hidden',
    ...WEB_HOVER_TRANSITION,
  },
  railItemHover: {
    backgroundColor: DS_COLORS.ground700,
  },
  /** Прижимает «Настройки» к низу колонки. */
  railSpacer: {
    flex: 1,
    minHeight: 16,
  },
  railDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: DS_COLORS.ground600,
    marginHorizontal: 14,
    marginBottom: 4,
  },
  railItemActive: {
    backgroundColor: DS_COLORS.ground700,
    borderLeftWidth: 3,
    borderLeftColor: DS_COLORS.accent400,
  },
  railItemInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  railItemInnerCollapsed: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    gap: 0,
  },
  railLabel: {
    flex: 1,
    fontFamily: 'Onest-SemiBold',
    fontSize: TAB_NAV_LABEL_FONT_PX,
    letterSpacing: 0.15,
    ...(Platform.OS === 'web'
      ? ({ lineHeight: Math.round(TAB_NAV_LABEL_FONT_PX * 1.25) } as object)
      : {}),
  },
  bottomBar: {
    borderTopWidth: 1,
    borderTopColor: DS_COLORS.ground600,
    backgroundColor: COLORS.Background2,
  },
  bottomBarLabeled: {
    ...(Platform.OS === 'web'
      ? ({
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
        } as object)
      : {}),
  },
  bottomBarCompact: {},
});
