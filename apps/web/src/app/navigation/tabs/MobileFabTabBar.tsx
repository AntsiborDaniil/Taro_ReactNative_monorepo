import AppMetrica from '@appmetrica/react-native-analytics';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { CommonActions } from '@react-navigation/native';
import { ReactElement, useCallback, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { ApplicationConfigContext } from 'entities/ApplicationConfig';
import { TabsAndRoutesContext } from 'shared/contexts/TabsAndRoutes';
import { useData } from 'shared/DataProvider';
import { BookIcon, CardsIcon, CrossIcon, PlanetIcon } from 'shared/icons';
import { blurActiveElement, WEB_HOVER_TRANSITION } from 'shared/lib';
import { useWebViewportInsets } from 'shared/lib/web/useWebViewportInsets';
import { COLORS } from 'shared/themes';
import { AnalyticAction, TabRoute } from 'shared/types';

const FAB_SIZE = 56;
const ACTION_GAP = 10;
const OPEN_SPRING = { damping: 15, stiffness: 240, mass: 0.85 };
const CLOSE_TIMING = { duration: 220, easing: Easing.in(Easing.cubic) };

const TAB_ITEMS = [
  {
    route: TabRoute.MainTab,
    Icon: PlanetIcon,
    labelKey: 'nav.tab.main' as const,
  },
  {
    route: TabRoute.SpreadsTab,
    Icon: CardsIcon,
    labelKey: 'nav.tab.spreads' as const,
  },
  {
    route: TabRoute.LibraryTab,
    Icon: BookIcon,
    labelKey: 'nav.tab.library' as const,
  },
] as const;

type FabActionItemProps = {
  index: number;
  Icon: (typeof TAB_ITEMS)[number]['Icon'];
  label: string;
  focused: boolean;
  openProgress: SharedValue<number>;
  onPress: () => void;
};

function FabActionItem({
  index,
  Icon,
  label,
  focused,
  openProgress,
  onPress,
}: FabActionItemProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const stagger = index * 0.1;
    const progress = interpolate(
      openProgress.value,
      [stagger, Math.min(stagger + 0.55, 1)],
      [0, 1],
      Extrapolation.CLAMP
    );

    return {
      opacity: progress,
      transform: [
        { translateY: interpolate(progress, [0, 1], [-24, 0]) },
        { translateX: interpolate(progress, [0, 1], [16, 0]) },
        { scale: interpolate(progress, [0, 1], [0.72, 1]) },
      ],
    };
  });

  return (
    <Animated.View
      style={[styles.actionAnimatedWrap, animatedStyle]}
      pointerEvents="box-none"
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={label}
        onPress={onPress}
        style={(pressState) => {
          const hovered =
            Platform.OS === 'web' &&
            (pressState as { hovered?: boolean }).hovered;
          return [
            styles.actionPressable,
            hovered && styles.actionPressableHover,
            pressState.pressed && styles.actionPressablePressed,
          ];
        }}
      >
        <View
          style={[styles.actionChip, focused && styles.actionChipFocused]}
        >
          <Icon
            width={22}
            height={22}
            fill={focused ? COLORS.Primary : COLORS.Content}
          />
          <Text
            style={[styles.actionLabel, focused && styles.actionLabelFocused]}
          >
            {label}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

type MobileFabTabBarProps = BottomTabBarProps;

export function MobileFabTabBar({
  state,
  navigation,
}: MobileFabTabBarProps): ReactElement {
  const { t } = useTranslation('core');
  const [menuOpen, setMenuOpen] = useState(false);
  const openProgress = useSharedValue(0);
  const viewportInsets = useWebViewportInsets();
  const { selectedTab, setSelectedTab } = useData({ Context: TabsAndRoutesContext });
  const { handleVibrationClick } = useData({ Context: ApplicationConfigContext });

  const focusedRoute = state.routes[state.index]?.name as TabRoute;

  const setOpen = useCallback(
    (next: boolean) => {
      setMenuOpen(next);
      openProgress.value = next
        ? withSpring(1, OPEN_SPRING)
        : withTiming(0, CLOSE_TIMING);
    },
    [openProgress]
  );

  const toggleOpen = useCallback(() => {
    setOpen(!menuOpen);
  }, [menuOpen, setOpen]);

  const navigateTo = useCallback(
    async (routeName: TabRoute) => {
      setOpen(false);
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
    [handleVibrationClick, navigation, selectedTab, setOpen, setSelectedTab]
  );

  const anchorTop = 12 + viewportInsets.top;
  const anchorRight = 16 + viewportInsets.right;

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(openProgress.value, [0, 1], [0, 1]),
  }));

  const fabStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: `${interpolate(openProgress.value, [0, 1], [0, 90])}deg`,
      },
      {
        scale: interpolate(openProgress.value, [0, 0.5, 1], [1, 1.06, 1]),
      },
    ],
  }));

  const planetIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(openProgress.value, [0, 0.35], [1, 0]),
    transform: [
      { scale: interpolate(openProgress.value, [0, 0.35], [1, 0.6]) },
    ],
  }));

  const crossIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(openProgress.value, [0.45, 1], [0, 1]),
    transform: [
      { scale: interpolate(openProgress.value, [0.45, 1], [0.6, 1]) },
    ],
  }));

  const actionsColumnStyle = useAnimatedStyle(() => ({
    opacity: interpolate(openProgress.value, [0, 0.2], [0, 1]),
  }));

  return (
    <View style={styles.host} pointerEvents="box-none">
      <Animated.View
        style={[styles.backdrop, backdropStyle]}
        pointerEvents={menuOpen ? 'auto' : 'none'}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => setOpen(false)}
          accessibilityRole="button"
          accessibilityLabel={t('nav.fab.close')}
        />
      </Animated.View>

      <View
        style={[styles.anchor, { top: anchorTop, right: anchorRight }]}
        pointerEvents="box-none"
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={menuOpen ? t('nav.fab.close') : t('nav.fab.open')}
          accessibilityState={{ expanded: menuOpen }}
          onPress={toggleOpen}
        >
          <Animated.View
            style={[styles.fab, fabStyle, menuOpen && styles.fabOpen]}
          >
            <Animated.View style={[styles.fabIconLayer, planetIconStyle]}>
              <PlanetIcon width={28} height={28} fill={COLORS.Background} />
            </Animated.View>
            <Animated.View style={[styles.fabIconLayer, crossIconStyle]}>
              <CrossIcon width={26} height={26} fill={COLORS.Content} />
            </Animated.View>
          </Animated.View>
        </Pressable>

        <Animated.View
          style={[styles.actionsColumn, actionsColumnStyle]}
          pointerEvents={menuOpen ? 'box-none' : 'none'}
        >
          {TAB_ITEMS.map(({ route, Icon, labelKey }, index) => (
            <FabActionItem
              key={route}
              index={index}
              Icon={Icon}
              label={t(labelKey)}
              focused={route === focusedRoute}
              openProgress={openProgress}
              onPress={() => navigateTo(route)}
            />
          ))}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    height: 0,
    zIndex: 120,
    elevation: 120,
    ...(Platform.OS === 'web' ? ({ pointerEvents: 'box-none' } as object) : {}),
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 12, 20, 0.55)',
    ...(Platform.OS === 'web'
      ? ({
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 110,
        } as object)
      : {}),
  },
  anchor: {
    position: 'absolute',
    alignItems: 'flex-end',
    zIndex: 130,
    ...(Platform.OS === 'web'
      ? ({
          position: 'fixed',
        } as object)
      : {}),
  },
  actionsColumn: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: ACTION_GAP,
    marginTop: 12,
  },
  actionAnimatedWrap: {
    alignItems: 'flex-end',
  },
  actionPressable: {
    borderRadius: 28,
    ...WEB_HOVER_TRANSITION,
  },
  actionPressableHover: {
    opacity: 0.92,
  },
  actionPressablePressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 28,
    backgroundColor: COLORS.Background2,
    borderWidth: 1,
    borderColor: 'rgba(244, 244, 245, 0.1)',
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
        } as object)
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }),
  },
  actionChipFocused: {
    borderColor: 'rgba(246, 192, 27, 0.45)',
    backgroundColor: 'rgba(246, 192, 27, 0.12)',
  },
  actionLabel: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 15,
    color: COLORS.Content,
  },
  actionLabelFocused: {
    color: COLORS.Content,
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.Primary,
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 10px 28px rgba(246, 192, 27, 0.45)',
        } as object)
      : {
          shadowColor: COLORS.Primary,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.4,
          shadowRadius: 12,
          elevation: 12,
        }),
  },
  fabOpen: {
    backgroundColor: COLORS.Background2,
    borderWidth: 1,
    borderColor: 'rgba(244, 244, 245, 0.15)',
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
        } as object)
      : {}),
  },
  fabIconLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
