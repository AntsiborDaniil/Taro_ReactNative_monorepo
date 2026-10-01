import AppMetrica from '@appmetrica/react-native-analytics';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { createResetTabToRootAction } from '../resetTabToRoot';
import { clearNavReturn } from '../navReturnStore';
import { ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
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
import {
  BookIcon,
  CardsIcon,
  CrossIcon,
  PlanetIcon,
  SettingsIcon,
} from 'shared/icons';
import { blurActiveElement, WEB_HOVER_TRANSITION } from 'shared/lib';
import { useWebViewportInsets } from 'shared/lib/web/useWebViewportInsets';
import { COLORS } from 'shared/themes';
import { DS_COLORS, DS_MOTION, DS_SIZES } from 'shared/themes/ds';
import { AnalyticAction, NavigationRoute, TabRoute } from 'shared/types';
import { Text, TEXT_TAGS, TEXT_WEIGHT } from 'shared/ui';
import {
  markFabDiscoveredInSession,
  readFabDiscoveredFromSession,
  useMobileFabScrollContext,
  useMobileFabPeekVisible,
  useMobileFabRevealOnRouteChange,
} from './MobileFabScrollContext';
import { isFabHostScreenFromTabState } from './mobileFabVisibility';

const FAB_SIZE = 48;
const ACTION_SIZE = 44;
const ACTION_GAP = 10;
const OPEN_SPRING = { damping: 15, stiffness: 240, mass: 0.85 };
const CLOSE_TIMING = { duration: 220, easing: Easing.in(Easing.cubic) };
const PEEK_HIDE_TIMING = { duration: 260, easing: Easing.out(Easing.cubic) };

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

type FabIcon = (typeof TAB_ITEMS)[number]['Icon'] | typeof SettingsIcon;

type FabActionItemProps = {
  index: number;
  Icon: FabIcon;
  label: string;
  focused: boolean;
  /** Closed menu: items stay mounted for the animation but must not catch taps. */
  interactive: boolean;
  openProgress: SharedValue<number>;
  onPress: () => void;
};

function FabActionItem({
  index,
  Icon,
  label,
  focused,
  interactive,
  openProgress,
  onPress,
}: FabActionItemProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const stagger = index * 0.09;
    const progress = interpolate(
      openProgress.value,
      [stagger, Math.min(stagger + 0.5, 1)],
      [0, 1],
      Extrapolation.CLAMP
    );

    return {
      opacity: progress,
      transform: [
        { translateY: interpolate(progress, [0, 1], [DS_MOTION.entryShift, 0]) },
      ],
    };
  });

  return (
    <Animated.View
      style={animatedStyle}
      pointerEvents={interactive ? 'box-none' : 'none'}
      aria-hidden={!interactive}
    >
      <Pressable
        disabled={!interactive}
        focusable={interactive}
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
            focused && styles.actionPressableFocused,
            hovered && styles.actionPressableHover,
            pressState.pressed && styles.actionPressablePressed,
          ];
        }}
      >
        <View
          style={[
            styles.actionIconBtn,
            focused && styles.actionIconBtnFocused,
          ]}
        >
          <Icon
            width={20}
            height={20}
            fill={focused ? COLORS.Primary : COLORS.Content}
          />
        </View>
        <Text
          category={TEXT_TAGS.p2}
          weight={TEXT_WEIGHT.medium}
          style={[styles.actionLabel, focused && styles.actionLabelFocused]}
          numberOfLines={1}
        >
          {label}
        </Text>
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
  const [fabDiscovered, setFabDiscovered] = useState(readFabDiscoveredFromSession);
  const openProgress = useSharedValue(0);
  const peekHide = useSharedValue(0);
  const discoverOpacity = useSharedValue(fabDiscovered ? 1 : 0.88);
  const viewportInsets = useWebViewportInsets();
  const fabPeekVisible = useMobileFabPeekVisible();
  const fabScrollCtx = useMobileFabScrollContext();
  const { selectedTab, setSelectedTab } = useData({ Context: TabsAndRoutesContext });
  const { handleVibrationClick } = useData({ Context: ApplicationConfigContext });

  const focusedRoute = state.routes[state.index]?.name as TabRoute;
  useMobileFabRevealOnRouteChange(focusedRoute);

  const isFabHostScreen = useMemo(
    () => isFabHostScreenFromTabState(state),
    [state]
  );
  const wasFabHostRef = useRef(isFabHostScreen);

  useEffect(() => {
    fabScrollCtx?.setFabHostScreen(isFabHostScreen);
  }, [fabScrollCtx, isFabHostScreen]);

  useEffect(() => {
    if (isFabHostScreen && !wasFabHostRef.current) {
      fabScrollCtx?.setFabPeekVisible(true);
    }
    wasFabHostRef.current = isFabHostScreen;
  }, [fabScrollCtx, isFabHostScreen]);

  const anchorBottom = 16 + viewportInsets.bottom;
  const anchorLeft = 16 + viewportInsets.left;

  const shouldShowFab = isFabHostScreen && (menuOpen || fabPeekVisible);

  useEffect(() => {
    peekHide.value = withTiming(shouldShowFab ? 0 : 1, PEEK_HIDE_TIMING);
  }, [shouldShowFab, peekHide]);

  useEffect(() => {
    discoverOpacity.value = withTiming(fabDiscovered ? 1 : 0.88, { duration: 300 });
  }, [fabDiscovered, discoverOpacity]);

  const setOpen = useCallback(
    (next: boolean) => {
      if (next) {
        markFabDiscoveredInSession();
        setFabDiscovered(true);
      }
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

  useEffect(() => {
    if (!isFabHostScreen && menuOpen) {
      setOpen(false);
    }
  }, [isFabHostScreen, menuOpen, setOpen]);

  const navigateTo = useCallback(
    async (routeName: TabRoute) => {
      setOpen(false);
      blurActiveElement();
      await handleVibrationClick?.();
      clearNavReturn();

      if (routeName === selectedTab) {
        navigation.dispatch(createResetTabToRootAction(routeName));
        return;
      }

      AppMetrica.reportEvent(AnalyticAction.ClickTab, { tabName: routeName });
      navigation.navigate(routeName);
      setSelectedTab?.(routeName);
    },
    [handleVibrationClick, navigation, selectedTab, setOpen, setSelectedTab]
  );

  const openSettings = useCallback(async () => {
    setOpen(false);
    blurActiveElement();
    await handleVibrationClick?.();
    clearNavReturn();
    AppMetrica.reportEvent(AnalyticAction.ClickSettings);
    navigation.navigate(TabRoute.LibraryTab, {
      screen: NavigationRoute.Settings,
    });
    setSelectedTab?.(TabRoute.LibraryTab);
  }, [handleVibrationClick, navigation, setOpen, setSelectedTab]);

  const focusedLibraryStack =
    focusedRoute === TabRoute.LibraryTab
      ? (state.routes[state.index] as { state?: { routes?: { name: string }[]; index?: number } })
          ?.state
      : undefined;
  const focusedLibraryScreen =
    focusedLibraryStack?.routes?.[focusedLibraryStack.index ?? 0]?.name;
  const settingsFocused = focusedLibraryScreen === NavigationRoute.Settings;

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(openProgress.value, [0, 1], [0, 1]),
  }));

  const anchorStyle = useAnimatedStyle(() => {
    const hideOffset = FAB_SIZE + anchorBottom + 24;

    return {
      opacity:
        discoverOpacity.value *
        interpolate(peekHide.value, [0, 1], [1, 0], Extrapolation.CLAMP),
      transform: [
        {
          translateY: interpolate(peekHide.value, [0, 1], [0, hideOffset]),
        },
      ],
    };
  });

  const fabStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: `${interpolate(openProgress.value, [0, 1], [0, 90])}deg`,
      },
    ],
  }));

  const planetIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(openProgress.value, [0, 0.35], [1, 0]),
    transform: [
      { translateY: interpolate(openProgress.value, [0, 0.35], [0, -DS_MOTION.entryShift / 2]) },
    ],
  }));

  const crossIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(openProgress.value, [0.45, 1], [0, 1]),
    transform: [
      { translateY: interpolate(openProgress.value, [0.45, 1], [DS_MOTION.entryShift / 2, 0]) },
    ],
  }));

  const actionsColumnStyle = useAnimatedStyle(() => ({
    opacity: interpolate(openProgress.value, [0, 0.15], [0, 1]),
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

      {/* Web: fixed to the bottom edge of the screen (CSS viewport), FAB grows up from it. */}
      <View
        style={[styles.anchorPoint, { left: anchorLeft, bottom: anchorBottom }]}
        pointerEvents="box-none"
      >
      <Animated.View
        style={[styles.anchor, anchorStyle]}
        pointerEvents="box-none"
      >
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
              interactive={menuOpen}
              openProgress={openProgress}
              onPress={() => navigateTo(route)}
            />
          ))}
          <FabActionItem
            index={TAB_ITEMS.length}
            Icon={SettingsIcon}
            label={t('nav.fab.settings')}
            focused={settingsFocused}
            interactive={menuOpen}
            openProgress={openProgress}
            onPress={() => {
              void openSettings();
            }}
          />
        </Animated.View>

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
              <PlanetIcon width={24} height={24} fill={DS_COLORS.ink50} />
            </Animated.View>
            <Animated.View style={[styles.fabIconLayer, crossIconStyle]}>
              <CrossIcon width={22} height={22} fill={DS_COLORS.ink50} />
            </Animated.View>
          </Animated.View>
        </Pressable>
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
    zIndex: 120,
    elevation: 120,
    pointerEvents: 'box-none',
    ...(Platform.OS === 'web' ? ({ height: 0 } as object) : {}),
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: `${DS_COLORS.ground900}CC`,
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
  /** Zero-height line at the FAB bottom edge; full width so labels are not squeezed. */
  anchorPoint: {
    position: 'absolute',
    right: 0,
    height: 0,
    zIndex: 130,
    pointerEvents: 'box-none',
    ...(Platform.OS === 'web'
      ? ({
          position: 'fixed',
        } as object)
      : {}),
  },
  anchor: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    alignItems: 'flex-start',
    pointerEvents: 'box-none',
  },
  actionsColumn: {
    flexDirection: 'column-reverse',
    alignItems: 'flex-start',
    gap: ACTION_GAP,
    marginBottom: 10,
  },
  actionPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: ACTION_SIZE,
    paddingRight: 14,
    borderRadius: ACTION_SIZE / 2,
    backgroundColor: DS_COLORS.ground700,
    borderWidth: 1,
    borderColor: DS_COLORS.ground600,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : {}),
    ...WEB_HOVER_TRANSITION,
  },
  actionPressableFocused: {
    borderColor: DS_COLORS.accent400,
    backgroundColor: DS_COLORS.ground700,
  },
  actionPressableHover: {
    opacity: 0.92,
  },
  actionPressablePressed: {
    opacity: 0.85,
    transform: [{ translateY: DS_MOTION.pressShiftY }],
  },
  actionIconBtn: {
    width: ACTION_SIZE,
    height: ACTION_SIZE,
    borderRadius: ACTION_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconBtnFocused: {},
  actionLabel: {
    color: COLORS.Content,
    fontSize: 14,
    lineHeight: 18,
    paddingVertical: 2,
  },
  actionLabelFocused: {
    color: DS_COLORS.accent400,
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    /** DS: плашка ground600 с гранью accent400 — навигация заметна, но не спорит с action500 экрана. */
    backgroundColor: DS_COLORS.ground600,
    borderWidth: DS_SIZES.edgeWidth,
    borderColor: DS_COLORS.accent400,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : {}),
  },
  fabOpen: {
    backgroundColor: DS_COLORS.ground800,
    borderColor: DS_COLORS.accent400,
  },
  fabIconLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
