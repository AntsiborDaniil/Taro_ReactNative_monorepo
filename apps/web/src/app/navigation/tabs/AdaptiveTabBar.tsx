import AppMetrica from '@appmetrica/react-native-analytics';
import { BottomTabBar, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { CommonActions } from '@react-navigation/native';
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
import { BookIcon, CardsIcon, ChevronLeftIcon, ChevronRightIcon, PlanetIcon } from 'shared/icons';
import { blurActiveElement } from 'shared/lib';
import { COLORS } from 'shared/themes';
import { AnalyticAction, TabRoute } from 'shared/types';
import {
  type AdaptiveTabVariant,
  TAB_BREAKPOINT_RAIL,
  TAB_RAIL_LABEL_FONT_PX,
} from './adaptiveTabLayout';

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
};

export function AdaptiveTabBar({
  variant,
  railWidth,
  railCollapsed = false,
  onToggleRailCollapsed,
  collapseLabel,
  expandLabel,
  state,
  descriptors,
  navigation,
  insets,
}: AdaptiveTabBarProps): ReactElement {
  const { width } = useWindowDimensions();
  const safe = useSafeAreaInsets();
  const { selectedTab, setSelectedTab } = useData({ Context: TabsAndRoutesContext });
  const { handleVibrationClick } = useData({ Context: ApplicationConfigContext });

  const onRailPress = useCallback(
    async (routeName: TabRoute) => {
      blurActiveElement();
      await handleVibrationClick?.();
      if (routeName === selectedTab) {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: routeName }],
          })
        );
        return;
      }
      AppMetrica.reportEvent(AnalyticAction.ClickTab, { tabName: routeName });
      navigation.navigate(routeName);
      setSelectedTab?.(routeName);
    },
    [handleVibrationClick, navigation, selectedTab, setSelectedTab]
  );

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
      </View>
    );
  }

  const barHeight =
    variant === 'labeled'
      ? Platform.OS === 'ios'
        ? 86
        : Platform.OS === 'web'
          ? 72
          : 72 + safe.bottom
      : Platform.OS === 'ios'
        ? 80
        : Platform.OS === 'web'
          ? 64
          : 60 + safe.bottom;

  return (
    <BottomTabBar
      state={state}
      descriptors={descriptors}
      navigation={navigation}
      insets={insets}
      style={[
        styles.bottomBar,
        variant === 'labeled' && styles.bottomBarLabeled,
        variant === 'compact' && styles.bottomBarCompact,
        {
          height: barHeight,
          paddingBottom:
            variant === 'labeled'
              ? Platform.OS === 'web'
                ? 10
                : Math.max(insets.bottom, 10)
              : Platform.OS === 'web'
                ? 8
                : Math.max(insets.bottom, 6),
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
    borderRightColor: 'rgba(244, 244, 245, 0.08)',
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '4px 0 24px rgba(0, 0, 0, 0.25)',
          transition: 'width 0.22s ease, min-width 0.22s ease',
        } as object)
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
  },
  railToggleHover: {
    backgroundColor: 'rgba(244, 244, 245, 0.08)',
  },
  railTogglePressed: {
    opacity: 0.85,
  },
  railItem: {
    marginHorizontal: 6,
    borderRadius: 14,
    overflow: 'hidden',
  },
  railItemHover: {
    backgroundColor: 'rgba(244, 244, 245, 0.06)',
  },
  railItemActive: {
    backgroundColor: 'rgba(246, 192, 27, 0.12)',
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: 'inset 3px 0 0 0 rgba(246, 192, 27, 0.95)',
        } as object)
      : {
          borderLeftWidth: 3,
          borderLeftColor: COLORS.Primary,
        }),
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
    fontFamily: 'Montserrat-SemiBold',
    fontSize: TAB_RAIL_LABEL_FONT_PX,
    letterSpacing: 0.15,
    ...(Platform.OS === 'web'
      ? ({ lineHeight: TAB_RAIL_LABEL_FONT_PX } as object)
      : {}),
  },
  bottomBar: {
    borderTopWidth: 0,
    backgroundColor: COLORS.Background2,
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.35)',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        } as object)
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.35,
          shadowRadius: 12,
          elevation: 16,
        }),
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
